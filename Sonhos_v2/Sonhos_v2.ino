#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>

const byte multiplexerAddress = 0x70; // HW617 I2C Address
PN532_I2C pn532_i2c(Wire); 
PN532 nfc(pn532_i2c);

const byte channels[] = {3, 5, 7}; // Channels to scan
const int numChannels = sizeof(channels) / sizeof(channels[0]);

const int fixedUidLength = 4;
char uids[numChannels][fixedUidLength * 2 + 1]; 

const unsigned long timeoutPeriod = 20000;
unsigned long lastReadTime = 0;

void selectHW617Channel(byte channel) {
  Wire.beginTransmission(multiplexerAddress);
  Wire.write(1 << channel);
  Wire.endTransmission();
}

// Function to check if UID changed
bool isDifferentUID(const char uid1[], const char uid2[]) {
  return strcmp(uid1, uid2) != 0;
}

// I2C Bus Recovery (prevents lockups)
void recoverI2CBus() {
  pinMode(A4, OUTPUT);
  pinMode(A5, OUTPUT);
  digitalWrite(A4, HIGH);
  digitalWrite(A5, HIGH);
  delay(10);
  pinMode(A4, INPUT_PULLUP);
  pinMode(A5, INPUT_PULLUP);
  Wire.begin();
}

void setup() {
  Serial.begin(9600);

  // Enable internal pull-ups for SDA (A4) and SCL (A5)
  pinMode(A4, INPUT_PULLUP);
  pinMode(A5, INPUT_PULLUP);

  Wire.begin();
  Wire.setClock(10000); // Set I²C speed to 10kHz

  nfc.begin();

  Serial.println("Initializing PN532 modules...");

  for (int i = 0; i < numChannels; i++) {
    selectHW617Channel(channels[i]);
    delay(10); 

    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata) {
      Serial.print("PN532 not detected on channel ");
      Serial.println(channels[i]);
    } else {
      Serial.print("PN532 detected on channel ");
      Serial.println(channels[i]);
      nfc.SAMConfig();
      nfc.setPassiveActivationRetries(0x8F);
    }
    
    uids[i][0] = '0';
    uids[i][1] = '\0';
  }

  lastReadTime = millis();
}

void printUIDs() {
  for (int i = 0; i < numChannels; i++) {
    Serial.print(uids[i]);
    if (i < numChannels - 1) {
      Serial.print(",");
    }
  }
  Serial.println();
}

void loop() {
  bool cardDetected = false;

  for (int i = 0; i < numChannels; i++) {
    selectHW617Channel(channels[i]);

    uint8_t uid[fixedUidLength] = {0};

    // Attempt to read card
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, nullptr)) {
      cardDetected = true;
      lastReadTime = millis();

      char uidString[fixedUidLength * 2 + 1] = {0};
      for (uint8_t j = 0; j < fixedUidLength; j++) {
        sprintf(uidString + j * 2, "%02X", uid[j]);
      }

      if (isDifferentUID(uids[i], uidString)) {
        strncpy(uids[i], uidString, fixedUidLength * 2 + 1);
        printUIDs();
      }
    } else {
      if (strcmp(uids[i], "0") != 0) {
        strncpy(uids[i], "0", fixedUidLength * 2 + 1);
        printUIDs();
      }
    }
  }

  // I²C Bus Recovery if no data for a long time
  if (!cardDetected && millis() - lastReadTime > timeoutPeriod) {
    Serial.println("No card detected for too long. Restarting I2C...");
    recoverI2CBus();
    lastReadTime = millis();
  }
}
