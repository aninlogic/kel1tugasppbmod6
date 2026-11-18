import { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import {
  Atlas,
  Canvas,
  FilterMode,
  Group,
  MipmapMode,
  Skia,
  rect,
  useRSXformBuffer,
  usePictureAsTexture,
} from "react-native-skia";
import { useIsFocused } from "@react-navigation/native";
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { tokens } from "../theme/tokens.js";

const { color } = tokens;

const DOT_COUNT = 240;
const HOLE_RADIUS = 78;
const BASE_SPEED = 0.18;
const TILT = 0.35;
const TEX = 32;

// Fibonacci sphere: deterministic, maximally uniform dot globe.
// y goes 1 → -1, golden-angle step per point.
function fibonacciSphere(n) {
  const pts = new Array(n);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    pts[i] = [Math.cos(theta) * r, y, Math.sin(theta) * r];
  }
  return pts;
}

const BASE_PTS = fibonacciSphere(DOT_COUNT);

function projectAll(angle, swell, R, cx, cy) {
  const out = new Array(DOT_COUNT);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const tilt = TILT + Math.sin(angle * 0.8) * 0.08;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const rr = R * swell;
  for (let i = 0; i < DOT_COUNT; i++) {
    const p = BASE_PTS[i];
    const x1 = p[0] * cosA + p[2] * sinA;
    const z1 = -p[0] * sinA + p[2] * cosA;
    const y1 = p[1] * cosT - z1 * sinT;
    const z2 = p[1] * sinT + z1 * cosT;
    const depth = (z2 + 1) / 2;
    const s = 2.2 / (2.2 - z2);
    const sx = cx + x1 * rr * s;
    const sy = cy + y1 * rr * s;
    const hx = sx - cx;
    const hy = sy - cy;
    const distSq = hx * hx + hy * hy;
    const holeSq = HOLE_RADIUS * HOLE_RADIUS;
    if (distSq < holeSq) {
      out[i] = [0, 0, -10000, -10000];
    } else {
      const fadeFactor = Math.min(1, (Math.sqrt(distSq) - HOLE_RADIUS) / 14);
      const sc = 0.24 * (0.65 + 0.75 * depth) * swell * fadeFactor;
      out[i] = [sc, 0, sx - (TEX / 2) * sc, sy - (TEX / 2) * sc];
    }
  }
  return out;
}

export function TempOrb({
  tint = color.text,
  beatKey = 0,
  size = 200,
  dimmed = false,
}) {
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const angleY = useSharedValue(0.6);
  const spinBoost = useSharedValue(0);
  const intensity = useSharedValue(0);
  const dimSV = useSharedValue(dimmed ? 1 : 0);
  const firstBeat = useRef(true);

  const R = (size * 0.8) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Multi-layer glowing particle texture: soft aura, bright corona, solid photon core
  const dotPicture = useMemo(() => {
    try {
      const recorder = Skia.PictureRecorder();
      const canvas = recorder.beginRecording(rect(0, 0, TEX, TEX));

      // Outer soft aura
      const auraPaint = Skia.Paint();
      auraPaint.setAntiAlias(true);
      auraPaint.setColor(Skia.Color("rgba(255, 255, 255, 0.35)"));
      canvas.drawCircle(TEX / 2, TEX / 2, TEX / 2 - 1, auraPaint);

      // Mid energy corona
      const midPaint = Skia.Paint();
      midPaint.setAntiAlias(true);
      midPaint.setColor(Skia.Color("rgba(255, 255, 255, 0.75)"));
      canvas.drawCircle(TEX / 2, TEX / 2, (TEX / 2) * 0.65, midPaint);

      // Bright solid core
      const corePaint = Skia.Paint();
      corePaint.setAntiAlias(true);
      corePaint.setColor(Skia.Color("white"));
      canvas.drawCircle(TEX / 2, TEX / 2, (TEX / 2) * 0.35, corePaint);

      return recorder.finishRecordingAsPicture();
    } catch {
      return null;
    }
  }, []);

  const dotImg = usePictureAsTexture(dotPicture, { width: TEX, height: TEX });

  const sprites = useMemo(
    () => new Array(DOT_COUNT).fill(0).map(() => rect(0, 0, TEX, TEX)),
    []
  );

  const transforms = useRSXformBuffer(DOT_COUNT, (val, i) => {
    "worklet";
    const p = BASE_PTS[i];
    const a = angleY.value;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const tilt = TILT + Math.sin(a * 0.8) * 0.08;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    // Organic digital plasma wave pulsation along sphere surface
    const wave = Math.sin(a * 2.5 + p[1] * 4) * 0.04 * (1 + intensity.value * 0.4);
    const swell = (1 + 0.05 * intensity.value) * (1 + wave);
    const rr = R * swell;

    const x1 = p[0] * cosA + p[2] * sinA;
    const z1 = -p[0] * sinA + p[2] * cosA;
    const y1 = p[1] * cosT - z1 * sinT;
    const z2 = p[1] * sinT + z1 * cosT;

    const depth = (z2 + 1) / 2;
    const s = 2.2 / (2.2 - z2);
    const sx = cx + x1 * rr * s;
    const sy = cy + y1 * rr * s;
    const hx = sx - cx;
    const hy = sy - cy;
    const distSq = hx * hx + hy * hy;
    const holeSq = HOLE_RADIUS * HOLE_RADIUS;

    if (distSq < holeSq) {
      val.set(0, 0, -10000, -10000);
      return;
    }

    // Soft fade transition near the temperature readout aperture
    const fadeFactor = Math.min(1, (Math.sqrt(distSq) - HOLE_RADIUS) / 14);
    const sc = 0.24 * (0.65 + 0.75 * depth) * swell * fadeFactor;
    val.set(sc, 0, sx - (TEX / 2) * sc, sy - (TEX / 2) * sc);
  });

  // First-frame insurance
  useEffect(() => {
    try {
      const initial = projectAll(0.6, 1, R, cx, cy);
      transforms.value = transforms.value.map((slot, i) => {
        slot.set(initial[i][0], initial[i][1], initial[i][2], initial[i][3]);
        return slot;
      });
    } catch {
      // buffer write unsupported — mapper pass will fill it
    }
  }, [transforms, R, cx, cy]);

  useEffect(() => {
    dimSV.set(withTiming(dimmed ? 1 : 0, { duration: 400 }));
  }, [dimmed, dimSV]);

  useEffect(() => {
    if (firstBeat.current) {
      firstBeat.current = false;
      return;
    }
    if (!beatKey || dimmed || reduceMotion) return;
    intensity.set(0);
    intensity.set(
      withSequence(
        withTiming(1, { duration: 140 }),
        withTiming(0.35, { duration: 180 }),
        withTiming(0.7, { duration: 120 }),
        withTiming(0, { duration: 300 })
      )
    );
    spinBoost.set(2.4);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // haptics unsupported
    }
  }, [beatKey, dimmed, reduceMotion, intensity, spinBoost]);

  const frame = useFrameCallback((info) => {
    "worklet";
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    spinBoost.value *= Math.pow(0.02, dt);
    angleY.value += dt * (BASE_SPEED + spinBoost.value);
  });

  useEffect(() => {
    frame.setActive(focused && !reduceMotion && !dimmed);
  }, [focused, reduceMotion, dimmed, frame]);

  const groupOpacity = useDerivedValue(() => 0.85 * (1 - 0.55 * dimSV.value));
  const colors = useMemo(() => new Array(DOT_COUNT).fill(tint), [tint]);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessible={false}>
      {/* Dynamic ambient telemetry aura rings */}
      <View
        style={[
          styles.ambientRingOuter,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: (size * 0.88) / 2,
            borderColor: tint,
            opacity: dimmed ? 0.04 : 0.12,
          },
        ]}
      />
      <View
        style={[
          styles.ambientRingInner,
          {
            width: size * 0.72,
            height: size * 0.72,
            borderRadius: (size * 0.72) / 2,
            borderColor: tint,
            opacity: dimmed ? 0.05 : 0.16,
          },
        ]}
      />

      <Canvas style={{ width: size, height: size, position: "absolute" }}>
        <Group opacity={groupOpacity}>
          <Atlas
            image={dotImg}
            sprites={sprites}
            transforms={transforms}
            colors={colors}
            colorBlendMode="modulate"
            sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.Linear }}
          />
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  ambientRingOuter: {
    position: "absolute",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  ambientRingInner: {
    position: "absolute",
    borderWidth: 1,
  },
});
