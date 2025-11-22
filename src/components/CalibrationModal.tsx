import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import ARCalibrationService from '../services/ARCalibrationService';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CalibrationModalProps {
  visible: boolean;
  onClose: () => void;
  onCalibrationComplete: (quality: 'poor' | 'fair' | 'good' | 'excellent') => void;
}

const CalibrationModal: React.FC<CalibrationModalProps> = ({
  visible,
  onClose,
  onCalibrationComplete
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStatus, setCalibrationStatus] = useState<any>(null);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      checkCalibrationStatus();
    }
  }, [visible]);

  useEffect(() => {
    if (isCalibrating) {
      startRotationAnimation();
      startProgressAnimation();
    }
  }, [isCalibrating]);

  const checkCalibrationStatus = async () => {
    const status = ARCalibrationService.getCalibrationStatus();
    setCalibrationStatus(status);
  };

  const startRotationAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const startProgressAnimation = () => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 10000, // 10 seconds calibration
      useNativeDriver: false,
    }).start();
  };

  const handleStartCalibration = async () => {
    try {
      setIsCalibrating(true);
      setCalibrationStep(1);
      setProgress(0);

      // Start calibration process
      await ARCalibrationService.startCalibration();

      // Check final status
      const finalStatus = ARCalibrationService.getCalibrationStatus();
      setCalibrationStatus(finalStatus);
      setCalibrationStep(2);
      setIsCalibrating(false);

      // Notify parent component
      onCalibrationComplete(finalStatus.calibrationQuality);

      // Show success message
      Alert.alert(
        'Calibration Complete!',
        `Quality: ${finalStatus.calibrationQuality.toUpperCase()}\n\nYour AR navigation will now be more accurate.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Calibration failed:', error);
      setIsCalibrating(false);
      setCalibrationStep(0);
      Alert.alert(
        'Calibration Failed',
        'Please try again. Make sure to move your device in a figure-8 pattern.',
        [{ text: 'OK' }]
      );
    }
  };

  const resetCalibration = () => {
    ARCalibrationService.resetCalibration();
    setCalibrationStatus(null);
    setCalibrationStep(0);
    setProgress(0);
    progressAnim.setValue(0);
    rotateAnim.setValue(0);
  };

  const getCalibrationStepContent = () => {
    switch (calibrationStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>AR Sensor Calibration</Text>
            <Text style={styles.stepDescription}>
              Calibrate your device sensors for better AR accuracy
            </Text>
            
            {calibrationStatus?.isCalibrated && (
              <View style={styles.statusContainer}>
                <View style={[styles.qualityIndicator, getQualityColor(calibrationStatus.calibrationQuality)]}>
                  <Text style={styles.qualityText}>
                    Current: {calibrationStatus.calibrationQuality.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.statusText}>
                  Magnetometer Accuracy: {Math.round(calibrationStatus.magnetometer.accuracy * 100)}%
                </Text>
                <Text style={styles.statusText}>
                  Accelerometer Accuracy: {Math.round(calibrationStatus.accelerometer.accuracy * 100)}%
                </Text>
              </View>
            )}

            {(!calibrationStatus?.isCalibrated || calibrationStatus.calibrationQuality === 'poor') && (
              <Text style={styles.warningText}>
                ⚠️ Calibration recommended for optimal AR performance
              </Text>
            )}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Calibrating...</Text>
            
            <View style={styles.animationContainer}>
              <Animated.View
                style={[
                  styles.phoneIcon,
                  {
                    transform: [{
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="phone-portrait" size={60} color="#007AFF" />
              </Animated.View>
            </View>

            <Text style={styles.stepDescription}>
              Move your device in a figure-8 pattern
            </Text>
            <Text style={styles.stepSubText}>
              Keep moving until calibration completes
            </Text>

            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>✅ Calibration Complete!</Text>
            
            <View style={[styles.qualityIndicator, getQualityColor(calibrationStatus?.calibrationQuality)]}>
              <Text style={styles.qualityText}>
                {calibrationStatus?.calibrationQuality.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.stepDescription}>
              Your AR navigation is now optimized for better accuracy
            </Text>

            <View style={styles.resultsContainer}>
              <Text style={styles.resultText}>
                📡 Compass Accuracy: {Math.round(calibrationStatus?.magnetometer.accuracy * 100)}%
              </Text>
              <Text style={styles.resultText}>
                📱 Motion Accuracy: {Math.round(calibrationStatus?.accelerometer.accuracy * 100)}%
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return { backgroundColor: '#34C759' };
      case 'good':
        return { backgroundColor: '#32D74B' };
      case 'fair':
        return { backgroundColor: '#FF9500' };
      case 'poor':
      default:
        return { backgroundColor: '#FF3B30' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AR Calibration</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {getCalibrationStepContent()}
        </View>

        <View style={styles.footer}>
          {calibrationStep === 0 && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleStartCalibration}
                disabled={isCalibrating}
              >
                <Text style={styles.primaryButtonText}>
                  {calibrationStatus?.isCalibrated ? 'Recalibrate' : 'Start Calibration'}
                </Text>
              </TouchableOpacity>

              {calibrationStatus?.isCalibrated && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={resetCalibration}
                >
                  <Text style={styles.secondaryButtonText}>Reset</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {calibrationStep === 1 && (
            <View style={styles.calibratingFooter}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.calibratingText}>Calibrating sensors...</Text>
            </View>
          )}

          {calibrationStep === 2 && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C7C7CC',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  stepSubText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  qualityIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 15,
    color: '#FF9500',
    textAlign: 'center',
    marginTop: 16,
  },
  animationContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  phoneIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  resultsContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
  },
  resultText: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
  },
  calibratingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  calibratingText: {
    fontSize: 17,
    color: '#8E8E93',
    marginLeft: 12,
  },
});

export default CalibrationModal;