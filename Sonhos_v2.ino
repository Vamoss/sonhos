#include <Wire.h>
#include <PN532_I2C.h>
#include <PN532.h>

const byte multiplexerAddress = 0x70; // Address detected for HW617
PN532_I2C pn532_i2c(Wire); // Initialize PN532 with I2C interface
PN532 nfc(pn532_i2c);

const byte channels[] = {3, 5, 7}; // Define the channels to scan in order
const int numChannels = sizeof(channels) / sizeof(channels[0]);

const int fixedUidLength = 4; // Fixed UID length (4 bytes in this example)
char uids[numChannels][fixedUidLength * 2 + 1]; // Matrix to store the UID as hex strings for each channel

void selectHW617Channel(byte channel) {
  Wire.beginTransmission(multiplexerAddress);
  Wire.write(1 << channel); // Activate the specified channel
  Wire.endTransmission();
}

// Function to compare two UID strings
bool isDifferentUID(const char uid1[], const char uid2[]) {
  return strcmp(uid1, uid2) != 0; // Returns true if strings are different
}

void setup() {
  Serial.begin(9600);
  Wire.begin();
  Wire.setClock(400000); // Set I2C speed to 400kHz for faster communication
  nfc.begin();
  
  //Serial.println("Initializing PN532 modules on specified channels...");
  
  // Initialize the PN532 for each channel
  for (int i = 0; i < numChannels; i++) {
    selectHW617Channel(channels[i]);
    delay(10); // Small delay to allow channel switching
    
    uint32_t versiondata = nfc.getFirmwareVersion();
    if (!versiondata) {
      Serial.print("PN532 not detected on channel ");
      Serial.println(channels[i]);
    } else {
      Serial.print("PN532 detected on channel ");
      Serial.println(channels[i]);
      nfc.SAMConfig(); // Configure PN532 to read cards
      
      // Set minimal retries to avoid delays in the detection loop
      nfc.setPassiveActivationRetries(0x0F); // Only try once per read attempt
    }
    
    uids[i][0] = '0'; // Initialize uids[i] to "0" for each channel initially
    uids[i][1] = '\0';
  }
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
  for (int i = 0; i < numChannels; i++) {
    selectHW617Channel(channels[i]);

    uint8_t uid[fixedUidLength] = {0}; // Temporary array to hold the detected UID

    // Check if a card is detected on the current channel
    if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, nullptr)) {
      // Convert UID to string
      char uidString[fixedUidLength * 2 + 1] = {0}; // Temporary string to hold the UID as hex
      for (uint8_t j = 0; j < fixedUidLength; j++) {
        sprintf(uidString + j * 2, "%02X", uid[j]); // Convert each byte to hex and append to string
      }

      // Check if this is a new UID for this channel
      if (isDifferentUID(uids[i], uidString)) {
        // Store the new UID as a string in the matrix and print only when there's a change
        strncpy(uids[i], uidString, fixedUidLength * 2 + 1);
        printUIDs();
      }
    } else {
      // No card detected; set UID to "0" for this channel if it was previously different
      if (strcmp(uids[i], "0") != 0) {
        strncpy(uids[i], "0", fixedUidLength * 2 + 1);
        printUIDs();
      }
    }
  }
}
