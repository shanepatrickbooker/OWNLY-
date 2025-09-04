import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../constants/Design';
import { getEmotionalFlowData, getTrendDirection } from '../utils/visualizations';
import { MoodEntry } from '../app/(tabs)/database/database';

interface EmotionalFlowProps {
  entries?: MoodEntry[];
  width?: number;
  height?: number;
  days?: number;
  showTrend?: boolean;
}

export default function EmotionalFlow({ 
  entries = [], 
  width = 300, 
  height = 120, 
  days = 14, 
  showTrend = true 
}: EmotionalFlowProps) {
  // Ensure entries is always an array
  const safeEntries = Array.isArray(entries) ? entries : [];
  
  const flowData = getEmotionalFlowData(safeEntries, days);
  const trendDirection = getTrendDirection(flowData);
  
  if (flowData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Add mood entries to see your emotional flow</Text>
        </View>
      </View>
    );
  }
  
  // Calculate dimensions
  const padding = 20;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  
  // Scale data to fit chart
  const xScale = chartWidth / Math.max(flowData.length - 1, 1);
  const yScale = chartHeight / 4; // Mood values are 1-5
  
  // Create SVG path for the flow line
  const pathData = flowData.map((point, index) => {
    const x = padding + (index * xScale);
    const y = padding + chartHeight - ((point.avgMood - 1) * yScale);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');
  
  // Create smooth curve
  const smoothPath = createSmoothPath(flowData, xScale, yScale, padding, chartHeight);
  
  // Trend colors
  const trendColors = {
    improving: Colors.primary[500],
    declining: Colors.warning, // Using warning color instead of orange
    stable: Colors.neutral[400]
  };
  
  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background grid lines */}
        {[1, 2, 3, 4, 5].map(mood => {
          const y = padding + chartHeight - ((mood - 1) * yScale);
          return (
            <Line
              key={mood}
              x1={padding}
              y1={y}
              x2={padding + chartWidth}
              y2={y}
              stroke={Colors.neutral[100]}
              strokeWidth="1"
              opacity={0.5}
            />
          );
        })}
        
        {/* Flow path */}
        <Path
          d={smoothPath}
          fill="none"
          stroke={trendColors[trendDirection]}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
        
        {/* Data points */}
        {flowData.map((point, index) => {
          const x = padding + (index * xScale);
          const y = padding + chartHeight - ((point.avgMood - 1) * yScale);
          
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={point.color}
              stroke="white"
              strokeWidth="1.5"
            />
          );
        })}
      </Svg>
      
      {showTrend && (
        <View style={styles.trendIndicator}>
          <View style={[styles.trendDot, { backgroundColor: trendColors[trendDirection] }]} />
          <Text style={[styles.trendText, { color: trendColors[trendDirection] }]}>
            {trendDirection === 'improving' && 'Trending upward'}
            {trendDirection === 'declining' && 'More challenging recently'}
            {trendDirection === 'stable' && 'Steady patterns'}
          </Text>
        </View>
      )}
    </View>
  );
}

// Helper function to create smooth curves
function createSmoothPath(
  data: ReturnType<typeof getEmotionalFlowData>,
  xScale: number,
  yScale: number,
  padding: number,
  chartHeight: number
): string {
  if (data.length < 2) {
    const point = data[0];
    const x = padding;
    const y = padding + chartHeight - ((point.avgMood - 1) * yScale);
    return `M ${x} ${y}`;
  }
  
  let path = '';
  
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const x = padding + (i * xScale);
    const y = padding + chartHeight - ((point.avgMood - 1) * yScale);
    
    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      // Create smooth curves using cubic Bezier curves
      const prevPoint = data[i - 1];
      const prevX = padding + ((i - 1) * xScale);
      const prevY = padding + chartHeight - ((prevPoint.avgMood - 1) * yScale);
      
      const cp1x = prevX + (x - prevX) * 0.5;
      const cp1y = prevY;
      const cp2x = prevX + (x - prevX) * 0.5;
      const cp2y = y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }
  }
  
  return path;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  trendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  trendText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium as any,
  },
});