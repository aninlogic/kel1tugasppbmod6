import { View, Text, StyleSheet, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { tokens } from "../theme/tokens.js";

const { color, space, radius, shadow } = tokens;

const MEMBERS = [
  {
    name: "Anindya Fairuz Az Zahra",
    nim: "21120124120018",
    initials: "AZ",
  },
  {
    name: "Farrel Satya Lukito",
    nim: "21120124140111",
    initials: "FL",
  },
  {
    name: "Yunita Dwi Ardilasari",
    nim: "21120124120001",
    initials: "YA",
  },
  {
    name: "Amirah Rahmah Wijayanti",
    nim: "21120124130068",
    initials: "AW",
  },
];

export function ProfileScreen() {
  return (
    <View style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Group Header Card */}
        <Animated.View
          style={styles.headerCard}
          entering={FadeInDown.duration(tokens.motion.entering)}
        >
          <View style={styles.groupBadge}>
            <Ionicons name="people" size={16} color={color.primary} />
            <Text style={styles.groupBadgeText}>KELOMPOK 01</Text>
          </View>
          <Text style={styles.headerTitle}>Praktikum PPB 2026</Text>
        </Animated.View>

        {/* Members Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Anggota Kelompok</Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{MEMBERS.length} Anggota</Text>
          </View>
        </View>

        {/* Member Cards */}
        {MEMBERS.map((member, index) => (
          <Animated.View
            key={member.nim}
            style={styles.memberCard}
            entering={FadeInDown.duration(tokens.motion.entering).delay(index * 60)}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{member.initials}</Text>
            </View>

            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={styles.nimRow}>
                <Ionicons name="card-outline" size={13} color={color.text3} />
                <Text style={styles.nimText}>NIM: {member.nim}</Text>
              </View>
            </View>

            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>#{index + 1}</Text>
            </View>
          </Animated.View>
        ))}

        {/* App & System Details Card */}
        <Animated.View
          style={styles.infoCard}
          entering={FadeInDown.duration(tokens.motion.entering).delay(300)}
        >
          <Text style={styles.infoTitle}>Informasi Sistem</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aplikasi</Text>
            <Text style={styles.infoValue}>LiveTemp Mobile</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Framework</Text>
            <Text style={styles.infoValue}>Expo SDK 58 / React Native</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database</Text>
            <Text style={styles.infoValue}>Neon Serverless PostgreSQL</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Protokol IoT</Text>
            <Text style={styles.infoValue}>MQTT (HiveMQ Broker)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Topik MQTT</Text>
            <Text style={[styles.infoValue, styles.monoText]}>ppb/kel01/iot/temperature</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bg,
  },
  container: {
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
    backgroundColor: color.bg,
  },
  headerCard: {
    backgroundColor: color.surface,
    padding: space.xl,
    borderRadius: radius.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: color.border,
    boxShadow: shadow.card,
    alignItems: "center",
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: color.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: color.text,
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: space.sm,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: color.text3,
  },
  countPill: {
    backgroundColor: color.surface2,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
  },
  countText: {
    fontSize: 11,
    fontWeight: "600",
    color: color.text2,
  },
  memberCard: {
    backgroundColor: color.surface,
    padding: space.lg,
    borderRadius: radius.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: color.border,
    boxShadow: shadow.card,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: color.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: color.text,
    marginBottom: 2,
  },
  nimRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nimText: {
    fontSize: 12,
    color: color.text3,
    fontFamily: "monospace",
  },
  orderBadge: {
    backgroundColor: color.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  orderText: {
    fontSize: 11,
    fontWeight: "600",
    color: color.text3,
  },
  infoCard: {
    backgroundColor: color.surface,
    padding: space.xl,
    borderRadius: radius.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: color.border,
    boxShadow: shadow.card,
    marginTop: space.sm,
    gap: space.sm,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: color.text,
    marginBottom: space.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: color.text2,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "500",
    color: color.text,
  },
  monoText: {
    fontFamily: "monospace",
    fontSize: 11,
    color: color.primary,
  },
});
