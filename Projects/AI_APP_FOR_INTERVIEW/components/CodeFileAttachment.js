import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CodeFileAttachment = ({ files, setFiles }) => {
  if (!files || files.length === 0) {
    return null;
  }

  const removeFile = (index) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
  };

  const formatFileSize = (size) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
      js: 'code',
      jsx: 'code',
      ts: 'code',
      tsx: 'code',
      py: 'code',
      java: 'code',
      c: 'code',
      cpp: 'code',
      h: 'code',
      hpp: 'code',
      cs: 'code',
      php: 'code',
      rb: 'code',
      go: 'code',
      rs: 'code',
      swift: 'code',
      kt: 'code',
      html: 'html',
      css: 'css',
      json: 'data_object',
      xml: 'code',
      md: 'description',
      txt: 'description',
      csv: 'table_view',
      sh: 'terminal',
      bat: 'terminal',
      ps1: 'terminal',
    };

    return iconMap[extension] || 'insert_drive_file';
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {files.map((file, index) => (
          <View key={index} style={styles.fileCard}>
            <View style={styles.fileIconContainer}>
              <Icon name={getFileIcon(file.name)} size={24} color="#4a90e2" />
            </View>
            <View style={styles.fileDetails}>
              <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                {file.name}
              </Text>
              <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={() => removeFile(index)}
            >
              <Icon name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  fileCard: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 8,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 200,
  },
  fileIconContainer: {
    marginRight: 8,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fileSize: {
    color: '#aaa',
    fontSize: 10,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default CodeFileAttachment;