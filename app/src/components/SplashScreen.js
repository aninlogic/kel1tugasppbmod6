import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { tokens } from "../theme/tokens.js";

const { color, space, radius } = tokens;

export function CustomSplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for logo ring
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Auto transition to main app
    const timer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        pulseLoop.stop();
        if (onFinish) onFinish();
      });
    }, 2200);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, [fadeAnim, scaleAnim, pulseAnim, exitAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glowing Logo Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <View style={styles.iconCircle}>
            <Ionicons name="thermometer-outline" size={48} color={color.primary} />
          </View>
        </View>

        {/* Title and App Info */}
        <Text style={styles.title}>LiveTemp</Text>
        <Text style={styles.subtitle}>IoT Temperature Telemetry & Control</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>KELOMPOK 01 · PRAKTIKUM PPB</Text>
        </View>

        {/* Loading Animation Dots */}
        <View style={styles.loadingContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotActive, { opacity: 0.7 }]} />
          <View style={[styles.dot, styles.dotActive, { opacity: 0.4 }]} />
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Teknik Komputer · Universitas Diponegoro</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  iconContainer: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.lg,
  },
  pulseRing: {
    position: "absolute",
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(37, 99, 235, 0.25)",
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: color.border,
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: color.text,
    letterSpacing: -0.5,
    fontFamily: "monospace",
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: 14,
    color: color.text2,
    textAlign: "center",
    marginBottom: space.md,
  },
  badge: {
    backgroundColor: color.surface2,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    marginBottom: space.xl,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: color.primary,
    letterSpacing: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: space.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.primary,
  },
  dotActive: {
    backgroundColor: color.primary,
  },
  footer: {
    position: "absolute",
    bottom: space.xxl,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: color.text3,
  },
});
