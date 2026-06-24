import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Animated } from 'react-native';
import Svg, { Rect, Path, Line, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface InteractiveMapProps {
  status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Rented';
  pickupAddress?: string;
  returnAddress?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ status, pickupAddress, returnAddress }) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  // Sync Animated value with React state for calculation of coordinates
  useEffect(() => {
    animatedProgress.setValue(0);
    if (status !== 'Ongoing' && status !== 'Rented') {
      setProgress(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(animatedProgress, {
        toValue: 1,
        duration: 12000, // 12 seconds loop
        useNativeDriver: true,
      })
    );

    animation.start();

    const listenerId = animatedProgress.addListener(({ value }) => {
      setProgress(value);
    });

    return () => {
      animation.stop();
      animatedProgress.removeListener(listenerId);
    };
  }, [status]);

  const pathD = "M 150 220 Q 140 150 160 100 T 300 130 T 330 60";

  // Calculate position along path based on progress
  const getBikeCoordinates = () => {
    const normStatus = status === 'Rented' ? 'Ongoing' : status;
    if (normStatus === 'Pending' || normStatus === 'Cancelled') {
      return { x: 150, y: 220 };
    }
    if (normStatus === 'Confirmed') {
      return { x: 155, y: 160 };
    }
    if (normStatus === 'Completed') {
      return { x: 330, y: 60 };
    }

    const t = progress;
    if (t < 0.33) {
      const localT = t / 0.33;
      return {
        x: 150 + (160 - 150) * localT,
        y: 220 + (100 - 220) * localT
      };
    } else if (t < 0.66) {
      const localT = (t - 0.33) / 0.33;
      return {
        x: 160 + (300 - 160) * localT,
        y: 100 + (130 - 100) * localT
      };
    } else {
      const localT = (t - 0.66) / 0.34;
      return {
        x: 300 + (330 - 300) * localT,
        y: 130 + (60 - 130) * localT
      };
    }
  };

  const bikePos = getBikeCoordinates();
  const isMoving = status === 'Ongoing' || status === 'Rented';

  return (
    <View style={styles.container}>
      <View style={styles.mapHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.headerText}>LIVE GPS MAP (ĐÀ NẴNG)</Text>
        </View>
        <View style={[styles.badge, isMoving ? styles.badgeMoving : styles.badgeStatic]}>
          <Text style={styles.badgeText}>{isMoving ? 'ĐANG DI CHUYỂN' : 'CHỜ DI CHUYỂN'}</Text>
        </View>
      </View>

      <View style={styles.mapWrapper}>
        <Svg viewBox="0 0 400 300" style={styles.svg}>
          {/* Background grid */}
          <Defs>
            <LinearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#CCFF00" stopOpacity={0.4} />
              <Stop offset="100%" stopColor="#CCFF00" stopOpacity={1} />
            </LinearGradient>
          </Defs>

          {/* Sông Hàn */}
          <Path 
            d="M 120 0 C 130 100 110 200 130 300 L 160 300 C 140 200 160 100 150 0 Z" 
            fill="rgba(59, 130, 246, 0.12)" 
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth="1.5"
          />
          <SvgText x="100" y="270" fill="rgba(59, 130, 246, 0.3)" fontSize="9" fontWeight="bold" transform="rotate(-78, 100, 270)">
            SÔNG HÀN
          </SvgText>

          {/* Sea Area */}
          <Path 
            d="M 330 0 C 340 100 320 200 340 300 L 400 300 L 400 0 Z" 
            fill="rgba(6, 182, 212, 0.05)"
          />
          <SvgText x="360" y="150" fill="rgba(6, 182, 212, 0.25)" fontSize="9" fontWeight="bold" transform="rotate(90, 360, 150)">
            BIỂN MỸ KHÊ
          </SvgText>

          {/* Cầu Rồng */}
          <Line x1="100" y1="210" x2="180" y2="210" stroke="rgba(234, 179, 8, 0.5)" strokeWidth="3" />
          <SvgText x="75" y="205" fill="rgba(234, 179, 8, 0.6)" fontSize="7" fontWeight="bold">Cầu Rồng</SvgText>

          {/* Route path */}
          <Path 
            d={pathD} 
            fill="none" 
            stroke="rgba(255,255,255,0.06)" 
            strokeWidth="4" 
          />
          
          <Path 
            d={pathD} 
            fill="none" 
            stroke="url(#routeGrad)" 
            strokeWidth="2.5" 
            strokeDasharray="5, 5"
          />

          {/* Store Pin */}
          <Circle cx="150" cy="220" r="12" fill="rgba(204, 255, 0, 0.1)" stroke="#CCFF00" strokeWidth="1" />
          <Circle cx="150" cy="220" r="4" fill="#CCFF00" />
          <SvgText x="150" y="242" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">CỬA HÀNG</SvgText>

          {/* Destination Pin */}
          <Circle cx="330" cy="60" r="12" fill="rgba(239, 68, 68, 0.1)" stroke="#EF4444" strokeWidth="1" />
          <Circle cx="330" cy="60" r="4" fill="#EF4444" />
          <SvgText x="330" y="80" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">ĐIỂM GIAO</SvgText>

          {/* Bike Node */}
          <G transform={`translate(${bikePos.x - 8}, ${bikePos.y - 8})`}>
            <Circle cx="8" cy="8" r="7" fill="#CCFF00" stroke="#000000" strokeWidth="1.5" />
            <Circle cx="8" cy="8" r="2.5" fill="#000000" />
          </G>
        </Svg>

        {/* Info panel overlaid */}
        <View style={styles.overlayPanel}>
          <Text style={styles.overlayTitle}>{isMoving ? 'Đang giao hàng' : 'Chuẩn bị xe'}</Text>
          <Text style={styles.overlaySub} numberOfLines={1}>Từ: {pickupAddress || 'Đại lý Motov'}</Text>
          <Text style={styles.overlaySub} numberOfLines={1}>Đến: {returnAddress || 'Địa chỉ khách hàng'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCFF00',
    marginRight: 6,
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeMoving: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 0.5,
    borderColor: '#CCFF00',
  },
  badgeStatic: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderWidth: 0.5,
    borderColor: '#9CA3AF',
  },
  badgeText: {
    fontSize: 8,
    color: '#CCFF00',
    fontWeight: 'bold',
  },
  mapWrapper: {
    position: 'relative',
    backgroundColor: '#030712',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  svg: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  overlayPanel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 6,
    padding: 6,
    maxWidth: 140,
  },
  overlayTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  overlaySub: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 1,
  },
});
