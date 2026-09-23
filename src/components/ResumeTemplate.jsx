import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Rect,
} from "@react-pdf/renderer";
import { useTranslations } from "next-intl";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.6,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  metricCard: {
    width: "30%",
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 6,
  },

  metricTitle: {
    fontSize: 9,
    color: "#666",
  },

  metricValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },

  section: {
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
  },

  row: {
    marginBottom: 3,
  },

  bullet: {
    marginBottom: 2,
  },

  postRow: {
    marginBottom: 6,
  },
});

const AudienceChart = ({ data }) => {
  // Guard the empty case: Math.max() of nothing is -Infinity, which made
  // every bar NaN-wide and crashed the renderer.
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.percent)) || 1;

  return (
    <Svg width="400" height="120">
      {data.map((item, i) => {
        const width = (item.percent / max) * 300;

        return (
          <Rect
            key={i}
            x={0}
            y={i * 25}
            width={width}
            height={12}
            fill="#333"
          />
        );
      })}
    </Svg>
  );
};

export default function ResumeTemplate({ data }) {
  const t = useTranslations("ResumeTemplate");

  return (
    <Document>
      {/* PAGE 1 — identity, headline metrics, summary, performance.
          Every block below is conditional: a creator whose Instagram has not
          returned a metric gets a shorter résumé, never an invented number. */}

      <Page size="A4" style={styles.page}>
        {/* HEADER */}

        <View style={styles.header}>
          {data.avatar ? (
            <Image alt="" style={styles.avatar} src={data.avatar} />
          ) : null}

          <View>
            <Text style={styles.name}>{data.name}</Text>

            <Text style={styles.subtitle}>
              @{data.handle}
              {data.niche ? ` • ${data.niche}` : ""}
              {data.location ? ` • ${data.location}` : ""}
            </Text>
          </View>
        </View>

        {/* METRIC CARDS */}

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>{t("metrics.followers")}</Text>
            <Text style={styles.metricValue}>{data.followers}</Text>
          </View>

          {data.engagement ? (
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t("metrics.engagement")}</Text>
              <Text style={styles.metricValue}>{data.engagement}</Text>
            </View>
          ) : null}

          {data.reelViews ? (
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>{t("metrics.reelViews")}</Text>
              <Text style={styles.metricValue}>{data.reelViews}</Text>
            </View>
          ) : null}
        </View>

        {/* SUMMARY */}

        {data.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("creatorSummary")}</Text>
            <Text>{data.summary}</Text>
          </View>
        ) : null}

        {/* CONTENT PERFORMANCE */}

        {data.avgLikes || data.avgComments || data.saves30d || data.reach30d ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("contentPerformance")}</Text>

            {data.avgLikes ? (
              <Text style={styles.row}>
                {t("averageLikes", { value: data.avgLikes })}
              </Text>
            ) : null}
            {data.avgComments ? (
              <Text style={styles.row}>
                {t("averageComments", { value: data.avgComments })}
              </Text>
            ) : null}
            {data.reach30d ? (
              <Text style={styles.row}>
                {t("reach30d", { value: data.reach30d })}
              </Text>
            ) : null}
            {data.saves30d ? (
              <Text style={styles.row}>
                {t("saves30d", { value: data.saves30d })}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* RATE CARD — what the creator actually charges. */}

        {data.rates?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("rateCard")}</Text>
            {data.rates.map((r, i) => (
              <View key={i} style={styles.postRow}>
                <Text>
                  {r.label} — {r.price}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* CONTENT THEMES */}

        {data.topics?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("contentThemes")}</Text>

            {data.topics.map((topic, i) => (
              <Text key={i} style={styles.bullet}>
                • {topic}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>

      {/* PAGE 2 — audience and top content. Skipped entirely when Instagram
          has given us neither. */}

      {data.audience?.length || data.topPosts?.length ? (
        <Page size="A4" style={styles.page}>
          {data.audience?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("audienceDemographics")}</Text>

              <AudienceChart data={data.audience} />

              {data.audience.map((item, i) => (
                <Text key={i}>
                  {item.country} — {item.percent}%
                </Text>
              ))}

              <Text style={{ marginTop: 6 }}>
                {t("gender", {
                  male: data.gender.male,
                  female: data.gender.female,
                })}
              </Text>
            </View>
          ) : null}

          {data.topPosts?.length ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("topPerformingContent")}</Text>

              {data.topPosts.map((post, i) => (
                <View key={i} style={styles.postRow}>
                  <Text>{post.title}</Text>
                  <Text>{t("likes", { value: post.likes })}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Page>
      ) : null}
    </Document>
  );
}
