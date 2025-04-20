import React from 'react';
import { Text, View, ScrollView, Linking, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import CodeBlock from '../components/CodeBlock';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/prism';


const styles = StyleSheet.create({
  // Styles remain unchanged
  guideContainer: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  guideText: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
  horizontalRule: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 10,
  },
  quote: {
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
    paddingLeft: 10,
    marginVertical: 10,
    backgroundColor: '#2a2a2a',
  },
  terminal: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
    fontFamily: 'monospace',
  },
  terminalText: {
    color: '#a0a0a0',
    fontFamily: 'monospace',
  },
  terminalCommand: {
    color: '#a0f0a0',
    fontFamily: 'monospace',
  },
  terminalOutput: {
    color: '#e0e0e0',
    fontFamily: 'monospace',
  },
  bashBlock: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  bashContent: {
    color: '#e0e0e0',
    fontFamily: 'monospace',
  },
  linkText: {
    color: '#4a90e2',
    textDecorationLine: 'underline',
  },
  nestedBullet: {
    flexDirection: 'row',
    marginLeft: 30,
    marginVertical: 4,
  }
});

// Function to handle opening URLs when links are clicked
const handleOpenURL = async (url) => {
  // Check if the URL is supported
  const supported = await Linking.canOpenURL(url);
  
  if (supported) {
    // Open the URL in the default browser
    await Linking.openURL(url);
  } else {
    // If the URL can't be opened, show an alert
    Alert.alert(
      "Cannot Open Link",
      `The URL ${url} cannot be opened by any available app.`,
      [{ text: "OK" }]
    );
  }
};

const formatInlineText = (text, isDarkBackground = true) => {
  if (!text) return null;
  
  const segments = [];
  let currentText = '';
  let inBold = false;
  let inItalic = false;
  let inCode = false;
  let inLink = false;
  let linkText = '';
  let linkUrl = '';
  let processingUrl = false;
  let nestedParenCount = 0; // Add counter for nested parentheses
  
  for (let i = 0; i < text.length; i++) {
    // Bold text handling
    if (i < text.length - 1 && text[i] === '*' && text[i + 1] === '*') {
      if (currentText) {
        segments.push({ text: currentText, bold: inBold, italic: inItalic, code: inCode, link: inLink, linkUrl });
        currentText = '';
      }
      inBold = !inBold;
      i++;
      continue;
    }
    
    // Italic text handling
    if (text[i] === '*' && (i === 0 || text[i - 1] !== '*') && (i === text.length - 1 || text[i + 1] !== '*')) {
      if (currentText) {
        segments.push({ text: currentText, bold: inBold, italic: inItalic, code: inCode, link: inLink, linkUrl });
        currentText = '';
      }
      inItalic = !inItalic;
      continue;
    }
    
    // Code text handling
    if (text[i] === '`') {
      if (currentText) {
        segments.push({ text: currentText, bold: inBold, italic: inItalic, code: inCode, link: inLink, linkUrl });
        currentText = '';
      }
      inCode = !inCode;
      continue;
    }
    
    // Link opening bracket handling
    if (text[i] === '[' && !inLink) {
      if (currentText) {
        segments.push({ text: currentText, bold: inBold, italic: inItalic, code: inCode, link: inLink, linkUrl });
        currentText = '';
      }
      inLink = true;
      linkText = '';
      linkUrl = '';
      continue;
    }

    // Link handling
    if (inLink) {
      // Found closing bracket for link text
      if (text[i] === ']' && !processingUrl) {
        processingUrl = true;
        continue;
      }
      
      // Found opening parenthesis for URL
      if (processingUrl && text[i] === '(' && nestedParenCount === 0) {
        continue;
      }
      
      // Track nested opening parenthesis
      if (processingUrl && text[i] === '(' && nestedParenCount > 0) {
        linkUrl += text[i];
        nestedParenCount++;
        continue;
      }
      
      // Track nested closing parenthesis
      if (processingUrl && text[i] === ')' && nestedParenCount > 1) {
        linkUrl += text[i];
        nestedParenCount--;
        continue;
      }
      
      // Found closing parenthesis for URL
      if (processingUrl && text[i] === ')' && nestedParenCount === 0) {
        segments.push({ text: linkText, bold: inBold, italic: inItalic, code: inCode, link: true, linkUrl });
        inLink = false;
        processingUrl = false;
        linkText = '';
        linkUrl = '';
        continue;
      }
      
      // Handle opening parenthesis within URL
      if (processingUrl && text[i] === '(' && linkUrl.length > 0) {
        nestedParenCount = 1;
        linkUrl += text[i];
        continue;
      }
      
      // Collecting link text or URL
      if (!processingUrl) {
        linkText += text[i];
      } else {
        linkUrl += text[i];
      }
      
      continue;
    }
    
    currentText += text[i];
  }
  
  if (currentText) {
    segments.push({ text: currentText, bold: inBold, italic: inItalic, code: inCode, link: inLink, linkUrl });
  }
  
  // Handle unclosed links gracefully
  if (inLink && linkText) {
    if (processingUrl && linkUrl) {
      segments.push({ text: linkText, bold: false, italic: false, code: false, link: true, linkUrl });
    } else {
      segments.push({ text: `[${linkText}]`, bold: false, italic: false, code: false, link: false });
    }
  }
  
  return segments.map((segment, index) => {
    const textStyle = [
      segment.bold && { fontWeight: 'bold' },
      segment.italic && { fontStyle: 'italic' },
      segment.code && { 
        fontFamily: 'monospace', 
        backgroundColor: '#333', 
        paddingHorizontal: 4,
        borderRadius: 3,
      },
      { color: '#fff' }
    ];
    
    if (segment.link) {
      return (
        <TouchableOpacity 
          key={index} 
          onPress={() => handleOpenURL(segment.linkUrl)}
          accessibilityRole="link"
          accessibilityHint={`Opens ${segment.linkUrl} in browser`}
        >
          <Text style={[textStyle, styles.linkText]}>
            {segment.text}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <Text key={index} style={textStyle}>
        {segment.text}
      </Text>
    );
  });
};

// Rest of the code remains unchanged
const TableCell = ({ content, isHeader }) => {
  return (
    <View>
      <Text style={[isHeader ? { fontWeight: 'bold' } : {}, { color: '#fff', fontSize: 14 }]}>
        {formatInlineText(content)}
      </Text>
    </View>
  );
};

const renderTable = (tableLines) => {
  if (tableLines.length < 3) return null;
  
  const headerCells = tableLines[0]
    .split('|')
    .filter(cell => cell.trim() !== '')
    .map(cell => cell.trim());
  
  const separatorRow = tableLines[1];
  const alignments = separatorRow
    .split('|')
    .filter(cell => cell.trim() !== '')
    .map(cell => {
      cell = cell.trim();
      if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
      if (cell.endsWith(':')) return 'right';
      return 'left';
    });
  
  const dataRows = tableLines.slice(2).map(row => 
    row
      .split('|')
      .filter(cell => cell.trim() !== '')
      .map(cell => cell.trim())
  );
  
  let columnWidths = new Array(headerCells.length).fill(0);
  headerCells.forEach((cell, index) => {
    const plainText = cell
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1');
    columnWidths[index] = Math.max(columnWidths[index], plainText.length * 10);
  });
  
  dataRows.forEach(row => {
    row.forEach((cell, index) => {
      if (index < columnWidths.length) {
        const plainText = cell
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/`(.*?)`/g, '$1');
        columnWidths[index] = Math.max(columnWidths[index], plainText.length * 10);
      }
    });
  });
  
  columnWidths = columnWidths.map(width => Math.max(width, 80));

  return (
    <ScrollView 
      horizontal={true} 
      style={{ 
        marginVertical: 8, 
        maxWidth: '100%',
      }}
    >
      <View style={{ 
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#333',
      }}>
        <View style={{ flexDirection: 'row', backgroundColor: '#2a2a2a' }}>
          {headerCells.map((cell, index) => (
            <View 
              key={`header-${index}`} 
              style={{ 
                width: columnWidths[index], 
                padding: 8,
                borderRightWidth: index < headerCells.length - 1 ? 1 : 0,
                borderRightColor: '#333',
                alignItems: alignments[index] === 'center' ? 'center' : 
                           alignments[index] === 'right' ? 'flex-end' : 'flex-start'
              }}
            >
              <TableCell content={cell} isHeader={true} />
            </View>
          ))}
        </View>
        
        {dataRows.map((row, rowIndex) => (
          <View 
            key={`row-${rowIndex}`} 
            style={{ 
              flexDirection: 'row',
              backgroundColor: rowIndex % 2 === 0 ? '#1f1f1f' : '#252525',
              borderTopWidth: 1,
              borderTopColor: '#333'
            }}
          >
            {row.map((cell, cellIndex) => (
              cellIndex < headerCells.length && (
                <View 
                  key={`cell-${rowIndex}-${cellIndex}`} 
                  style={{ 
                    width: columnWidths[cellIndex],
                    padding: 8,
                    borderRightWidth: cellIndex < row.length - 1 ? 1 : 0,
                    borderRightColor: '#333',
                    alignItems: alignments[cellIndex] === 'center' ? 'center' : 
                               alignments[cellIndex] === 'right' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <TableCell content={cell} isHeader={false} />
                </View>
              )
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const isTerminalCommand = (line) => {
  return line.trim().startsWith('$') || 
         line.trim().startsWith('>') || 
         line.trim().startsWith('#') && !line.trim().startsWith('# ');
};

const renderTerminalContent = (lines) => {
  return (
    <View style={styles.terminal}>
      {lines.map((line, index) => {
        if (isTerminalCommand(line)) {
          return (
            <Text key={`term-cmd-${index}`} style={styles.terminalCommand}>
              {line}
            </Text>
          );
        } else {
          return (
            <Text key={`term-out-${index}`} style={styles.terminalOutput}>
              {line}
            </Text>
          );
        }
      })}
    </View>
  );
};

const isBashBlock = (line) => line.trim().toLowerCase() === 'bash';

const renderBashContent = (lines) => {
  return (
    <View style={styles.bashBlock}>
      {lines.map((line, index) => (
        <Text key={`bash-line-${index}`} style={styles.bashContent}>
          {line}
        </Text>
      ))}
    </View>
  );
};

// Helper function to check if a line is a nested bullet point
const isNestedBulletPoint = (line) => {
  return line.match(/^\s+- (.*)/);
};

// Extract content from a nested bullet point line
const extractNestedBulletContent = (line) => {
  const match = line.match(/^\s+- (.*)/);
  return match ? match[1] : '';
};

// 导出一个名为formatText的函数，用于格式化文本
export const formatText = (text) => {
  // 如果文本为空，则返回null
  if (!text) return null;
  
  // 清理文本，去除<think>标签及其内容
  let cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>/g, '');
  // 将清理后的文本按行分割
  const lines = cleanedText.split('\n');
  const components = [];
  let tableLines = [];
  let inTable = false;
  let terminalLines = [];
  let inTerminal = false;
  let bashLines = [];
  let inBash = false;
  let inOrderedList = false;
  let currentOrderedListItem = null;
  let currentOrderedListNumber = null;
  let orderedListNestedItems = [];
  
  const formattingGuide = [
    "**Bold** text",
    "*Italic* text", 
    "`Code snippets`",
    "[Link Text](https://url.com)",
    "# Header 1",
    "## Header 2",
    "### Header 3",
    "#### Header 4",
    "- Bulleted lists",
    "1. Numbered lists",
    "> Blockquotes",
    "``` code blocks```",
    "--- Horizontal rules"
  ];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');
    const isOrderedListItem = line.match(/^(\d+)\. (.*)/);
    const isNestedItem = isNestedBulletPoint(line);
    
    // Handle ordered list with nested bullets
    if (inOrderedList) {
      // If it's a nested bullet point within the ordered list
      if (isNestedItem) {
        orderedListNestedItems.push(extractNestedBulletContent(line));
        continue;
      } 
      // If it's a new ordered list item
      else if (isOrderedListItem) {
        // First, render the previous ordered list item with its nested bullets
        if (currentOrderedListItem !== null) {
          components.push(
            <View key={`ordered-list-${i-1}`} style={{ marginVertical: 4 }}>
              <View style={{ flexDirection: 'row', marginLeft: 10 }}>
                <Text style={{ color: '#4a90e2', marginRight: 8, minWidth: 16 }}>{currentOrderedListNumber}.</Text>
                <Text style={{ color: '#fff', flex: 1 }}>{formatInlineText(currentOrderedListItem)}</Text>
              </View>
              
              {orderedListNestedItems.map((nestedItem, nestedIndex) => (
                <View key={`nested-${i-1}-${nestedIndex}`} style={styles.nestedBullet}>
                  <Text style={{ color: '#4a90e2', marginRight: 8 }}>•</Text>
                  <Text style={{ color: '#fff', flex: 1 }}>{formatInlineText(nestedItem)}</Text>
                </View>
              ))}
            </View>
          );
        }
        
        // Start a new ordered list item
        const [, number, content] = isOrderedListItem;
        currentOrderedListItem = content;
        currentOrderedListNumber = number;
        orderedListNestedItems = [];
        continue;
      } 
      // If it's neither a nested bullet nor a new ordered list item, end the ordered list
      else {
        // Render the last ordered list item with its nested bullets
        if (currentOrderedListItem !== null) {
          components.push(
            <View key={`ordered-list-final-${i}`} style={{ marginVertical: 4 }}>
              <View style={{ flexDirection: 'row', marginLeft: 10 }}>
                <Text style={{ color: '#4a90e2', marginRight: 8, minWidth: 16 }}>{currentOrderedListNumber}.</Text>
                <Text style={{ color: '#fff', flex: 1 }}>{formatInlineText(currentOrderedListItem)}</Text>
              </View>
              
              {orderedListNestedItems.map((nestedItem, nestedIndex) => (
                <View key={`nested-final-${i}-${nestedIndex}`} style={styles.nestedBullet}>
                  <Text style={{ color: '#4a90e2', marginRight: 8 }}>•</Text>
                  <Text style={{ color: '#fff', flex: 1 }}>{formatInlineText(nestedItem)}</Text>
                </View>
              ))}
            </View>
          );
        }
        
        inOrderedList = false;
        currentOrderedListItem = null;
        currentOrderedListNumber = null;
        orderedListNestedItems = [];
      }
    }
    
    if (!inBash && isBashBlock(line)) {
      inBash = true;
      bashLines = [];
      continue;
    }
    
    if (inBash) {
      if (line.trim() === '' && i + 1 < lines.length) {
        components.push(
          <View key={`bash-${i}`}>
            {renderBashContent(bashLines)}
          </View>
        );
        bashLines = [];
        inBash = false;
        continue;
      } else if (line.trim() !== '') {
        bashLines.push(line);
        continue;
      } else {
        bashLines.push(line);
        continue;
      }
    }
    
    if (!inTerminal && (line.trim().startsWith('$ ') || line.trim().startsWith('> ') || 
        line.match(/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+:/))) {
      inTerminal = true;
      terminalLines = [line];
      continue;
    }
    
    if (inTerminal) {
      if (line.trim() === '' && i + 1 < lines.length && 
          !isTerminalCommand(lines[i + 1]) && 
          !lines[i + 1].match(/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+:/)) {
        components.push(
          <View key={`terminal-${i}`}>
            {renderTerminalContent(terminalLines)}
          </View>
        );
        terminalLines = [];
        inTerminal = false;
        continue;
      } else {
        terminalLines.push(line);
        continue;
      }
    }
    
    if (!inTable && isTableLine && i + 1 < lines.length && 
        lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
      inTable = true;
      tableLines = [line];
      continue;
    }
    
    if (inTable) {
      if (isTableLine) {
        tableLines.push(line);
        continue;
      } else {
        components.push(
          <View key={`table-${i}`}>
            {renderTable(tableLines)}
          </View>
        );
        tableLines = [];
        inTable = false;
      }
    }
    
    if (line.trim().match(/^-{3,}$/)) {
      components.push(
        <View key={`hr-${i}`} style={styles.horizontalRule} />
      );
      continue;
    }

    if (line.match(/^# (.*)/)) {
      components.push(
        <Text key={`h1-${i}`} style={{ fontSize: 24, fontWeight: 'bold', marginVertical: 8, color: '#fff' }}>
          {formatInlineText(line.replace(/^# (.*)/, '$1'))}
        </Text>
      );
      continue;
    }
    
    if (line.match(/^## (.*)/)) {
      components.push(
        <Text key={`h2-${i}`} style={{ fontSize: 20, fontWeight: 'bold', marginVertical: 6, color: '#fff' }}>
          {formatInlineText(line.replace(/^## (.*)/, '$1'))}
        </Text>
      );
      continue;
    }
    
    if (line.match(/^### (.*)/)) {
      components.push(
        <Text key={`h3-${i}`} style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 4, color: '#fff' }}>
          {formatInlineText(line.replace(/^### (.*)/, '$1'))}
        </Text>
      );
      continue;
    }
    
    if (line.match(/^#### (.*)/)) {
      components.push(
        <Text key={`h4-${i}`} style={{ fontSize: 16, fontWeight: 'bold', marginVertical: 3, color: '#ccc' }}>
          {formatInlineText(line.replace(/^#### (.*)/, '$1'))}
        </Text>
      );
      continue;
    }
    
    // Start a new ordered list
    if (isOrderedListItem && !inOrderedList) {
      inOrderedList = true;
      const [, number, content] = isOrderedListItem;
      currentOrderedListItem = content;
      currentOrderedListNumber = number;
      orderedListNestedItems = [];
      continue;
    }
    

    if (line.match(/^  - (.*)/)) {
      // Sublist item like Input: / Output:
      const [, content] = line.match(/^  - (.*)/);
      const labelMatch = content.match(/^(\w+):\s*(.*)/); // Split label and value
    
      if (labelMatch) {
        const [, label, value] = labelMatch;
    
        components.push(
          <View key={`sublist-${i}`} style={{ marginLeft: 20, marginVertical: 2 }}>
            <Text style={{ color: '#f5c518' }}>
              {formatInlineText(label + ':')} <Text style={{ color: '#fff' }}>{formatInlineText(value)}</Text>
            </Text>
          </View>
        );
      } else {
        components.push(
          <View key={`sublist-${i}`} style={{ marginLeft: 20, marginVertical: 2 }}>
            <Text style={{ color: '#fff' }}>{formatInlineText(content)}</Text>
          </View>
        );
      }
      continue;
    }
    

    if (line.match(/^- (.*)/)) {
      const [, content] = line.match(/^- (.*)/);
      components.push(
        <View key={`list-${i}`} style={{ flexDirection: 'row', marginLeft: 10, marginVertical: 4 }}>
          <Text style={{ color: '#4a90e2', marginRight: 8 }}>•</Text>
          <Text style={{ color: '#fff', flex: 1 }}>{formatInlineText(content)}</Text>
        </View>
      );
      continue;
    }
    
    if (line.match(/^> (.*)/)) {
      components.push(
        <View key={`quote-${i}`} style={styles.quote}>
          <Text style={{ fontStyle: 'italic', color: '#ccc' }}>
            {formatInlineText(line.replace(/^> (.*)/, '$1'))}
          </Text>
        </View>
      );
      continue;
    }

    if (line.match(/^\s{3}```(.*)/)) {
      let language = line.replace(/^\s{3}```(.*)/, '$1').trim() || 'text';
      let codeBlockContent = '';
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\s{3}```/)) {
        codeBlockContent += lines[j] + (j < lines.length - 1 && !lines[j + 1].match(/^\s{3}```/) ? '\n' : '');
        j++;
      }
      components.push(
        <CodeBlock
          key={`code-block-${i}`}
          code={codeBlockContent}
          language={language}
          showLineNumbers={true}
        />
      );
      i = j;
      continue;
    }
    
    if (line.startsWith('```')) {
      let codeBlockContent = '';
      let language = line.replace('```', '').trim() || 'text';
      let j = i + 1;
    
      const isTerminalBlock = language === 'bash' || 
                              language === 'shell' || 
                              language === 'terminal' || 
                              language === 'console';
    
      // Collecting the code content until we encounter another closing code block
      while (j < lines.length && !lines[j].startsWith('```')) {
        codeBlockContent += lines[j] + (j < lines.length - 1 && !lines[j + 1].startsWith('```') ? '\n' : '');
        j++;
      }
    
      if (j < lines.length) {
        if (isTerminalBlock) {
          // Display terminal content properly
          components.push(
            <View key={`terminal-block-${i}`}>
              {renderTerminalContent(codeBlockContent.trim().split('\n'))}
            </View>
          );
        } else {
          components.push(
            <CodeBlock
              key={`code-block-${i}`}
              code={codeBlockContent}
              language={language}
              showLineNumbers={true}
            />
          );
        }
        i = j;
        continue;
      }
    }
    
    
    // Parse inline URLs that aren't in markdown format
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (line.trim() && line.match(urlRegex)) {
      const parts = line.split(urlRegex);
      const elements = [];
      
      for (let k = 0; k < parts.length; k++) {
        if (k % 2 === 0) {
          if (parts[k]) {
            elements.push(
              <Text key={`text-${k}`} style={{ color: '#fff' }}>
                {formatInlineText(parts[k])}
              </Text>
            );
          }
        } else {
          elements.push(
            <TouchableOpacity 
              key={`url-${k}`} 
              onPress={() => handleOpenURL(parts[k])}
              accessibilityRole="link"
              accessibilityHint={`Opens ${parts[k]} in browser`}
            >
              <Text style={styles.linkText}>{parts[k]}</Text>
            </TouchableOpacity>
          );
        }
      }
      
      components.push(
        <View key={`line-${i}`} style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 2 }}>
          {elements}
        </View>
      );
      continue;
    }
    
    if (line.trim()) {
      components.push(
        <Text key={`line-${i}`} style={{ marginVertical: 2, color: '#fff', fontSize: 16 }}>
          {formatInlineText(line)}
        </Text>
      );
    } else {
      components.push(
        <View key={`space-${i}`} style={{ height: 8 }} />
      );
    }
  }
  
  // Handle any remaining ordered list item at the end of text
  if (inOrderedList && currentOrderedListItem !== null) {
    components.push(
      <View key={`ordered-list-final`} style={{ marginVertical: 4 }}>
        <View style={{ flexDirection: 'row', marginLeft: 10 }}>
          <Text style={{ color: '#4a90e2', marginRight: 8, minWidth: 16 }}>{currentOrderedListNumber}.</Text>
          <Text style={{ color: '#fff', flex: 1 }}>{formatInlineText(currentOrderedListItem)}</Text>
        </View>
        
        {orderedListNestedItems.map((nestedItem, nestedIndex) => (
          <View key={`nested-final-${nestedIndex}`} style={styles.nestedBullet}>
            <Text style={{ color: '#4a90e2', marginRight: 8 }}>•</Text>
            <Text style={{ color: '#fff', flex: 1 }}>{formatInlineText(nestedItem)}</Text>
          </View>
        ))}
      </View>
    );
  }
  
  if (inTable && tableLines.length > 0) {
    components.push(
      <View key={`table-final`}>
        {renderTable(tableLines)}
      </View>
    );
  }
  
  if (inTerminal && terminalLines.length > 0) {
    components.push(
      <View key={`terminal-final`}>
        {renderTerminalContent(terminalLines)}
      </View>
    );
  }
  
  if (inBash && bashLines.length > 0) {
    components.push(
      <View key={`bash-final`}>
        {renderBashContent(bashLines)}
      </View>
    );
  }
  
  return components;
};

export const renderFormattedText = (text) => formatText(text);

export default formatText;