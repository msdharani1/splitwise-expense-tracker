import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

const languageColorMap = {
  javascript: '#f1e05a',
  python: '#3572A5',
  html: '#e34c26',
  css: '#563d7c',
  java: '#b07219',
  cpp: '#f34b7d',
  c: '#555555',
  csharp: '#178600',
  ruby: '#701516',
  php: '#4F5D95',
  swift: '#ffac45',
  go: '#00ADD8',
  rust: '#dea584',
  kotlin: '#F18E33',
  typescript: '#2b7489',
  shell: '#89e051',
  bash: '#89e051',
  json: '#292929',
  yaml: '#cb171e',
  markdown: '#083fa1',
  sql: '#e38c00',
};

const CodeBlock = ({ code, language, showLineNumbers = true }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [contentDimensions, setContentDimensions] = useState({ width: 0, height: 0 });
  const scrollViewRef = useRef(null);

  const MAX_VISIBLE_LINES = 15;
  const MAX_WIDTH = Dimensions.get('window').width * 0.8;
  const LINE_HEIGHT = 20;

  const handleCopy = () => {
    Clipboard.setString(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getLanguageName = () => {
    const languageMap = {
      cpp: "C++",
      "c++": "C++",
      c: "C",
      cs: "C#",
      java: "Java",
      py: "Python",
      python: "Python",
      js: "JavaScript",
      javascript: "JavaScript",
      sql: "SQL",
      bash: "Bash",
      sh: "Shell",
      shell: "Shell",
      json: "JSON",
      html: "HTML",
      xml: "XML",
      css: "CSS",
      go: "Go",
      rb: "Ruby",
      php: "PHP",
      swift: "Swift",
      kt: "Kotlin",
      kotlin: "Kotlin",
      sc: "Scala",
      scala: "Scala",
      rs: "Rust",
      rust: "Rust",
      ts: "TypeScript",
      typescript: "TypeScript",
      m: "Objective-C",
      objc: "Objective-C",
      r: "R",
      d: "D",
      dart: "Dart",
      lua: "Lua",
      groovy: "Groovy",
      perl: "Perl",
      pl: "Perl",
      tex: "TeX",
      tsx: "TypeScript",
      jsx: "JavaScript",
      vue: "Vue",
      yaml: "YAML",
      yml: "YAML",
    };
    return languageMap[language?.toLowerCase()] || "Text";
  };

  const applySyntaxHighlighting = (codeText) => {
    const lines = codeText.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
      let coloredLine = [];
      const lang = language?.toLowerCase() || 'text';

      // Handle bash/shell comments (lines starting with #)
      if ((lang === 'bash' || lang === 'shell' || lang === 'sh') && line.trim().startsWith('#')) {
        return (
          <Text key={index} style={[styles.commentText, { lineHeight: LINE_HEIGHT }]}>
            {line}
            {'\n'}
          </Text>
        );
      }

      const words = line.split(/(\s+|\(|\)|{|}|;)/);
      let inString = false;
      let inComment = false;

      const keywords = {
        javascript: ['function', 'const', 'let', 'var', 'if', 'else', 'return', 'class'],
        python: ['def', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'class'],
        java: ['public', 'private', 'class', 'static', 'void', 'int', 'String'],
        cpp: ['int', 'void', 'class', 'public', 'private', 'return'],
        c: ['int', 'void', 'return', 'if', 'else'],
        bash: ['if', 'then', 'else', 'fi', 'for', 'while', 'do', 'done'],
        shell: ['if', 'then', 'else', 'fi', 'for', 'while', 'do', 'done'],
      };

      const langKeywords = keywords[lang] || [];

      words.forEach((word, wordIndex) => {
        if (inComment) {
          coloredLine.push(
            <Text key={`${index}-${wordIndex}`} style={styles.commentText}>
              {word}
            </Text>
          );
          return;
        }

        if (word.startsWith('//') || (lang !== 'bash' && lang !== 'shell' && lang !== 'sh' && word.startsWith('#'))) {
          inComment = true;
          coloredLine.push(
            <Text key={`${index}-${wordIndex}`} style={styles.commentText}>
              {word}
            </Text>
          );
          return;
        }

        if (word === '"' || word === "'") {
          inString = !inString;
          coloredLine.push(
            <Text key={`${index}-${wordIndex}`} style={styles.stringText}>
              {word}
            </Text>
          );
          return;
        }

        if (inString) {
          coloredLine.push(
            <Text key={`${index}-${wordIndex}`} style={styles.stringText}>
              {word}
            </Text>
          );
        } else if (langKeywords.includes(word)) {
          coloredLine.push(
            <Text key={`${index}-${wordIndex}`} style={styles.keywordText}>
              {word}
            </Text>
          );
        } else if (!isNaN(word) && word.trim() !== '') {
          coloredLine.push(
            <Text key={`${index}-${wordIndex}`} style={styles.numberText}>
              {word}
            </Text>
          );
        } else {
          coloredLine.push(
            <Text key={`${index}-${wordIndex}`} style={styles.codeText}>
              {word}
            </Text>
          );
        }
      });

      return (
        <Text key={index} style={{ lineHeight: LINE_HEIGHT }}>
          {coloredLine}
          {'\n'}
        </Text>
      );
    });
  };

  const lines = code.split('\n').filter(line => line.trim() !== '');
  const needsVerticalScroll = lines.length > MAX_VISIBLE_LINES;
  const needsHorizontalScroll = contentDimensions.width > MAX_WIDTH;

  const handleContentLayout = (event) => {
    const { width, height } = event.nativeEvent.layout;
    setContentDimensions({ width, height });
  };

  const renderCodeContent = (isModal = false) => (
    <ScrollView
      ref={isModal ? null : scrollViewRef}
      horizontal={true}
      nestedScrollEnabled={true}
      style={[
        styles.codeScrollView,
        isModal ? styles.modalCodeScrollView : { maxHeight: MAX_VISIBLE_LINES * LINE_HEIGHT }
      ]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={needsVerticalScroll}
      showsHorizontalScrollIndicator={needsHorizontalScroll}
    >
      <ScrollView 
        vertical={true}
        nestedScrollEnabled={true}
        style={styles.innerScrollView}
        contentContainerStyle={styles.innerScrollContent}
      >
        <View onLayout={handleContentLayout} style={styles.codeContent}>
          {showLineNumbers && (
            <View style={styles.lineNumbers}>
              {lines.map((_, index) => (
                <Text key={`line-${index}`} style={styles.lineNumber}>
                  {index + 1}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.codeTextContainer}>
            {applySyntaxHighlighting(code)}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.languageText, { color: languageColorMap[language?.toLowerCase()] || '#4a90e2' }]}>
            {getLanguageName()}
          </Text>
          <Text style={styles.linesText}>
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleExpand} style={styles.actionButton}>
            <Text style={styles.actionText}>
              {isExpanded ? 'Collapse' : 'Expand'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
            <Text style={styles.actionText}>
              {isCopied ? 'Copied!' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderCodeContent()}

      {(needsVerticalScroll || needsHorizontalScroll) && !isExpanded && (
        <View style={styles.fadeOverlay} />
      )}

      <Modal
        visible={isExpanded}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleExpand}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>{getLanguageName()}</Text>
              <TouchableOpacity onPress={toggleExpand} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            {renderCodeContent(true)}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    borderRadius: 5,
    backgroundColor: '#1f1f1f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    maxWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  linesText: {
    fontSize: 12,
    color: '#ccc',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    color: '#4a90e2',
    fontSize: 12,
  },
  codeScrollView: {
    backgroundColor: '#1f1f1f',
  },
  modalCodeScrollView: {
    backgroundColor: '#1f1f1f',
    maxHeight: '80%',
  },
  innerScrollView: {
    backgroundColor: '#1f1f1f',
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerScrollContent: {
    flexGrow: 1,
  },
  codeContent: {
    flexDirection: 'row',
    padding: 10,
  },
  lineNumbers: {
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#333',
    alignItems: 'flex-end',
  },
  lineNumber: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
    marginBottom: 6.5
  },
  codeTextContainer: {
    flex: 1,
  },
  codeText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  keywordText: {
    color: '#c678dd',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  stringText: {
    color: '#98c379',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  numberText: {
    color: '#d19a66',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  commentText: {
    color: '#5c6370',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(31, 31, 31, 0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#1f1f1f',
    borderRadius: 5,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalHeaderText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
  },
});

export default CodeBlock; 