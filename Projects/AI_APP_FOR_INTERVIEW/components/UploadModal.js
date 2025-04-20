import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const UploadModal = ({ visible, onClose, onUploadImage, onUploadFile }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.uploadModalOverlay}>
        <View style={styles.uploadModalContainer}>
          <TouchableOpacity style={styles.uploadOption} onPress={onUploadImage}>
            <Icon name="image" size={24} color="#4a90e2" />
            <Text style={styles.uploadOptionText}>Upload Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadOption} onPress={onUploadFile}>
            <Icon name="attach-file" size={24} color="#4a90e2" />
            <Text style={styles.uploadOptionText}>Upload File</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadCancel} onPress={onClose}>
            <Text style={styles.uploadCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadModalContainer: {
    backgroundColor: "#252525",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  uploadOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    width: "100%",
  },
  uploadOptionText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  uploadCancel: {
    marginTop: 20,
    paddingVertical: 10,
  },
  uploadCancelText: {
    color: "#4a90e2",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default UploadModal;