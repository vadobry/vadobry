import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import * as SMS from 'expo-sms';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import SmsRetriever from 'react-native-sms-retriever';

// Target phone number
const TARGET_PHONE_NUMBER = '2868';

// Button data with addresses and codes
const BUTTONS_DATA = [
  { address: 'Пермякова 3а', code: '72001' },
  { address: 'Осипенко 81', code: '72006' },
  { address: 'Голышева 4', code: '72669' },
  { address: 'Алматинская 2', code: '72919' },
  { address: 'Достоевского 20', code: '72979' },
  { address: 'Широтная 19', code: '72016' },
  { address: 'Червишевский тракт 33', code: '72017' },
  { address: 'Московский тракт 161', code: '72018' },
  { address: 'Шаимский 10', code: '72021' },
  { address: 'Депутатская 91', code: '72053' },
  { address: 'Федюнинского 62', code: '72756' },
  { address: 'Республики 86к1', code: '72085' },
];

export default function App() {
  const [lastMessage, setLastMessage] = useState('Нет сообщений');
  const [customCode, setCustomCode] = useState('');
  const [hasSmsPermission, setHasSmsPermission] = useState(false);

  // Request SMS permissions
  const requestSmsPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const receiveSmsPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          {
            title: 'Разрешение на получение SMS',
            message: 'Приложению требуется разрешение на получение SMS сообщений.',
            buttonPositive: 'OK',
          }
        );

        const sendSmsPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          {
            title: 'Разрешение на отправку SMS',
            message: 'Приложению требуется разрешение на отправку SMS сообщений.',
            buttonPositive: 'OK',
          }
        );

        if (
          receiveSmsPermission === PermissionsAndroid.RESULTS.GRANTED &&
          sendSmsPermission === PermissionsAndroid.RESULTS.GRANTED
        ) {
          setHasSmsPermission(true);
          startSmsListener();
        } else {
          Alert.alert(
            'Ошибка разрешений',
            'Для работы приложения необходимы разрешения на отправку и получение SMS.'
          );
        }
      } catch (err) {
        console.warn(err);
        Alert.alert('Ошибка', 'Не удалось запросить разрешения.');
      }
    }
  };

  // Start SMS listener
  const startSmsListener = async () => {
    try {
      const registered = await SmsRetriever.startSmsRetriever();
      if (registered) {
        SmsRetriever.addSmsListener(event => {
          const { message, originatingAddress } = event;
          
          // Check if the message is from our target number
          if (originatingAddress === TARGET_PHONE_NUMBER) {
            setLastMessage(message);
          }
        });
      }
    } catch (error) {
      console.error('SMS Retriever Error:', error);
    }

    return () => SmsRetriever.removeSmsListener();
  };

  // Send SMS function
  const sendSms = async (message: string) => {
    if (!hasSmsPermission) {
      Alert.alert('Ошибка', 'Нет разрешения на отправку SMS.');
      return;
    }

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      try {
        const { result } = await SMS.sendSMSAsync([TARGET_PHONE_NUMBER], message);
        if (result === 'sent' || result === 'unknown') {
          Toast.show({
            type: 'success',
            text1: 'Успешно',
            text2: `Сообщение "${message}" отправлено на номер ${TARGET_PHONE_NUMBER}`,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Ошибка',
            text2: 'Не удалось отправить сообщение',
          });
        }
      } catch (error) {
        console.error('Error sending SMS:', error);
        Toast.show({
          type: 'error',
          text1: 'Ошибка',
          text2: 'Не удалось отправить сообщение',
        });
      }
    } else {
      Alert.alert('Ошибка', 'SMS недоступны на этом устройстве.');
    }
  };

  // Handle button press
  const handleButtonPress = (code: string) => {
    sendSms(code);
  };

  // Handle custom code send
  const handleCustomCodeSend = () => {
    if (customCode.trim() === '') {
      Alert.alert('Ошибка', 'Введите код для отправки.');
      return;
    }

    if (!/^\d+$/.test(customCode)) {
      Alert.alert('Ошибка', 'Код должен содержать только цифры.');
      return;
    }

    sendSms(customCode);
    setCustomCode('');
  };

  // Request permissions on component mount
  useEffect(() => {
    requestSmsPermissions();

    // Cleanup SMS listener on unmount
    return () => {
      SmsRetriever.removeSmsListener();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Last Message Section */}
      <View style={styles.messageContainer}>
        <Text style={styles.sectionTitle}>Последнее сообщение:</Text>
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{lastMessage}</Text>
        </View>
      </View>

      {/* Buttons Grid */}
      <Text style={styles.sectionTitle}>Адреса:</Text>
      <ScrollView style={styles.scrollView}>
        <View style={styles.buttonsGrid}>
          {BUTTONS_DATA.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.button}
              onPress={() => handleButtonPress(item.code)}
            >
              <Text style={styles.buttonText}>{item.address}</Text>
              <Text style={styles.codeText}>{item.code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Custom Code Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Номер БС 72</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={customCode}
            onChangeText={setCustomCode}
            placeholder="Введите код"
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleCustomCodeSend}
          >
            <Text style={styles.sendButtonText}>Отправить</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast message component */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 50,
  },
  messageContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  messageBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minHeight: 80,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#4a86e8',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  codeText: {
    color: '#e6f0ff',
    fontSize: 12,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

