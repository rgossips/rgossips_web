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
  const max = Math.max(...data.map((d) => d.percent));

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
  return (
    <Document>
      {/* PAGE 1 */}

      <Page size="A4" style={styles.page}>
        {/* HEADER */}

        <View style={styles.header}>
          <Image alt="user-img" style={styles.avatar} src={data.avatar} />

          <View>
            <Text style={styles.name}>{data.name}</Text>

            <Text style={styles.subtitle}>
              @{data.handle} • {data.niche}
            </Text>
          </View>
        </View>

        {/* METRIC CARDS */}

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Followers</Text>
            <Text style={styles.metricValue}>{data.followers}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Engagement</Text>
            <Text style={styles.metricValue}>{data.engagement}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Avg Reel Views</Text>
            <Text style={styles.metricValue}>{data.avgReelViews}</Text>
          </View>
        </View>

        {/* SUMMARY */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creator Summary</Text>
          <Text>{data.summary}</Text>
        </View>

        {/* CONTENT PERFORMANCE */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Performance</Text>

          <Text style={styles.row}>Average Likes: {data.avgLikes}</Text>
          <Text style={styles.row}>Average Comments: {data.avgComments}</Text>
          <Text style={styles.row}>Average Saves: {data.avgSaves}</Text>
        </View>

        {/* REEL PERFORMANCE */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reel Performance</Text>

          <Text style={styles.row}>Best Reel Views: {data.bestReelViews}</Text>

          <Text style={styles.row}>
            Watch Completion: {data.watchCompletion}%
          </Text>
        </View>

        {/* CONTENT THEMES */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Themes</Text>

          {data.topics.map((topic, i) => (
            <Text key={i} style={styles.bullet}>
              • {topic}
            </Text>
          ))}
        </View>
      </Page>

      {/* PAGE 2 */}

      <Page size="A4" style={styles.page}>
        {/* AUDIENCE */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audience Demographics</Text>

          <AudienceChart data={data.audience} />

          {data.audience.map((item, i) => (
            <Text key={i}>
              {item.country} — {item.percent}%
            </Text>
          ))}

          <Text style={{ marginTop: 6 }}>
            Gender: {data.gender.male}% Male • {data.gender.female}% Female
          </Text>
        </View>

        {/* BRAND FIT */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best Brand Fit</Text>

          {data.brandFit.map((item, i) => (
            <Text key={i}>• {item}</Text>
          ))}
        </View>

        {/* TOP POSTS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Content</Text>

          {data.topPosts.map((post, i) => (
            <View key={i} style={styles.postRow}>
              <Text>{post.title}</Text>
              <Text>{post.views} views</Text>
            </View>
          ))}
        </View>

        {/* BRAND COLLABS */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Brand Collaborations</Text>

          {data.collabs.map((brand, i) => (
            <Text key={i}>• {brand}</Text>
          ))}
        </View>

        {/* CAMPAIGN FORECAST */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Estimated Campaign Performance
          </Text>

          <Text>Estimated Reach: {data.estimatedReach}</Text>
          <Text>Estimated Engagement: {data.estimatedEngagement}</Text>
        </View>
      </Page>
    </Document>
  );
}
