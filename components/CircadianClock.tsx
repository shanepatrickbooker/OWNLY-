import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Typography, Spacing } from '../constants/Design';
import { getCircadianData } from '../utils/visualizations';
import { MoodEntry } from '../app/(tabs)/database/database';

interface CircadianClockProps {
  entries?: MoodEntry[];
  size?: number;
  showLabels?: boolean;
}

export default function CircadianClock({ entries = [], size = 200, showLabels = true }: CircadianClockProps) {
  // Ensure entries is always an array
  const safeEntries = Array.isArray(entries) ? entries : [];
  
  const circadianData = getCircadianData(safeEntries);
  const center = size / 2;
  const clockRadius = size * 0.35;
  
  // Hour markers for 6AM, 12PM, 6PM, 12AM
  const majorHours = [6, 12, 18, 0];
  const hourLabels = ['6 AM', '12 PM', '6 PM', '12 AM'];
  
  if (safeEntries.length === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Add some mood entries to see your daily patterns</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Clock circle */}
        <Circle
          cx={center}
          cy={center}
          r={clockRadius}
          fill="none"
          stroke={Colors.neutral[200]}
          strokeWidth="1"
        />
        
        {/* Hour markers */}
        {majorHours.map((hour, index) => {
          const angle = (hour - 6) * 15; // -6 to start at 6AM at bottom
          const x1 = center + Math.cos(angle * Math.PI / 180) * (clockRadius - 10);
          const y1 = center + Math.sin(angle * Math.PI / 180) * (clockRadius - 10);
          const x2 = center + Math.cos(angle * Math.PI / 180) * clockRadius;
          const y2 = center + Math.sin(angle * Math.PI / 180) * clockRadius;
          
          return (
            <Line
              key={hour}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={Colors.neutral[400]}
              strokeWidth="2"
            />
          );
        })}
        
        {/* Hour labels */}
        {showLabels && majorHours.map((hour, index) => {
          const angle = (hour - 6) * 15;
          const labelRadius = clockRadius + 20;
          const x = center + Math.cos(angle * Math.PI / 180) * labelRadius;
          const y = center + Math.sin(angle * Math.PI / 180) * labelRadius + 4; // +4 for vertical centering
          
          return (
            <SvgText
              key={`label-${hour}`}
              x={x}
              y={y}
              fontSize="10"
              fill={Colors.text.secondary}
              textAnchor="middle"
            >
              {hourLabels[index]}
            </SvgText>
          );
        })}
        
        {/* Mood data points */}
        {circadianData.map(data => {
          if (data.count === 0) return null;
          
          const x = center + Math.cos(data.angle * Math.PI / 180) * (clockRadius * 0.7);
          const y = center + Math.sin(data.angle * Math.PI / 180) * (clockRadius * 0.7);
          
          return (
            <Circle
              key={data.hour}
              cx={x}
              cy={y}
              r={data.size}
              fill={data.color}
              opacity={0.8}
            />
          );
        })}
        
        {/* Center dot */}
        <Circle
          cx={center}
          cy={center}
          r="3"
          fill={Colors.primary[500]}
        />
      </Svg>
      
      {showLabels && (
        <View style={styles.legend}>
          <Text style={styles.legendText}>Daily Rhythms</Text>
          <Text style={styles.legendSubtext}>
            When you typically check in • Larger dots = more frequent
          </Text>
        </View>
      )}
    </View>
  );
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
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  legend: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  legendText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  legendSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});