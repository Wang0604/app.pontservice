import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { ContractVariables, ContractTemplateId } from './types';

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    lineHeight: 1.6,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  h1: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  h2: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  meta: {
    marginBottom: 12,
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
  },
  paragraph: {
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    width: 14,
  },
  bulletText: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 4,
  },
  tableCellLabel: {
    width: 120,
    fontWeight: 'bold',
  },
  tableCellValue: {
    flex: 1,
  },
  signatureBlock: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureItem: {
    width: '45%',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingBottom: 32,
  },
});

/**
 * Minimal renderer: takes the rendered markdown output (string) and 
 * presents it as structured PDF. This is a thin wrapper — the actual
 * content layout is governed by the markdown file + this React PDF 
 * structure (per template id).
 *
 * For Stage 0 we render a simple "wrapped text" PDF of the compiled markdown.
 * Upgrading to fully styled PDF can happen later without changing the pipeline.
 */
export function ContractDocument({
  markdown,
  variables,
  templateId,
}: {
  markdown: string;
  variables: ContractVariables;
  templateId: ContractTemplateId;
}) {
  // Remove markdown syntax noise for simple flowing text in PDF
  const lines = markdown.split('\n');

  return (
    <Document
      title={`Pontai Contract ${variables.orderNumber}`}
      author={variables.provider.companyName}
    >
      <Page size="A4" style={styles.page}>
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return (
              <Text key={idx} style={styles.h1}>
                {line.replace(/^# /, '')}
              </Text>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <Text key={idx} style={styles.h2}>
                {line.replace(/^## /, '')}
              </Text>
            );
          }
          if (line.startsWith('**合同编号**:') || line.startsWith('**签署日期**:')) {
            return (
              <Text key={idx} style={styles.meta}>
                {line.replace(/\*\*/g, '')}
              </Text>
            );
          }
          if (line.trim() === '---') {
            return <Text key={idx} style={styles.paragraph}> </Text>;
          }
          if (line.startsWith('- ')) {
            return (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{line.replace(/^- /, '').replace(/\*\*/g, '')}</Text>
              </View>
            );
          }
          if (line.match(/^\d+\. /)) {
            return (
              <Text key={idx} style={styles.paragraph}>
                {line.replace(/\*\*/g, '')}
              </Text>
            );
          }
          if (line.trim() === '') {
            return <Text key={idx}> </Text>;
          }
          return (
            <Text key={idx} style={styles.paragraph}>
              {line.replace(/\*\*/g, '')}
            </Text>
          );
        })}

        <View style={styles.signatureBlock}>
          <View style={styles.signatureItem}>
            <Text>甲方签署</Text>
            <Text style={{ color: '#999', fontSize: 9 }}>
              {variables.customer.companyName}
            </Text>
          </View>
          <View style={styles.signatureItem}>
            <Text>乙方签署</Text>
            <Text style={{ color: '#999', fontSize: 9 }}>
              {variables.provider.companyName}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
