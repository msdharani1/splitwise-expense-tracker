import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MessageFileAttachment = ({ files }) => {
  if (!files || files.length === 0) {
    return null;
  }

  const formatFileSize = (size) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const getFileIcon = (filename, type) => {
    if (type && type.startsWith("image/")) {
      return null; // We'll display the image thumbnail instead
    }

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
      <Text style={styles.attachmentTitle}>Attached Files:</Text>
      {files.map((file, index) => (
        <View key={index} style={styles.fileCard}>
          {file.type && file.type.startsWith("image/") ? (
            <Image
              source={{ uri: file.uri }}
              style={styles.imageThumbnail}
              resizeMode="cover"
            />
          ) : (
            <Icon name={getFileIcon(file.name, file.type)} size={18} color="#a5bde6" style={styles.fileIcon} />
          )}
          <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
            {file.name}
          </Text>
          <Text style={styles.fileSize}>({formatFileSize(file.size)})</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
  },
  attachmentTitle: {
    color: '#dbd9d9',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    flexWrap: 'wrap',
  },
  fileIcon: {
    marginRight: 6,
  },
  imageThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 6,
  },
  fileName: {
    color: '#ddd',
    fontSize: 12,
    flex: 1,
    minWidth: 100,
  },
  fileSize: {
    color: '#dbd9d9',
    fontSize: 10,
    marginLeft: 4,
  },
});

export default MessageFileAttachment;