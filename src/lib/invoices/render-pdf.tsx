import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 20, textAlign: 'center', marginBottom: 24 },
  header: { fontSize: 10, marginBottom: 24, color: '#666' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', padding: 6 },
  label: { width: 120, fontWeight: 'bold' },
  value: { flex: 1 },
  total: { fontSize: 14, fontWeight: 'bold', marginTop: 16, textAlign: 'right' },
  note: { fontSize: 9, marginTop: 32, color: '#999' },
});

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  buyerName: string;
  buyerTaxId?: string;
  sellerName: string;
  sellerTaxId: string;
  itemName: string;
  amountPreTax: number;
  taxRate: number;
  tax: number;
  total: number;
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  return (
    <Document title={`Invoice ${data.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>增值税普通发票</Text>
        <Text style={styles.header}>
          发票编号: {data.invoiceNumber}    开票日期: {data.issueDate}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>购方名称</Text>
          <Text style={styles.value}>{data.buyerName}</Text>
        </View>
        {data.buyerTaxId && (
          <View style={styles.row}>
            <Text style={styles.label}>购方税号</Text>
            <Text style={styles.value}>{data.buyerTaxId}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>销方名称</Text>
          <Text style={styles.value}>{data.sellerName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>销方税号</Text>
          <Text style={styles.value}>{data.sellerTaxId}</Text>
        </View>

        <View style={{ marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 6 }}>
          <Text>项目</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ flex: 3 }}>{data.itemName}</Text>
          <Text style={{ flex: 1, textAlign: 'right' }}>¥{data.amountPreTax.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ flex: 3 }}>税额（{(data.taxRate * 100).toFixed(0)}%）</Text>
          <Text style={{ flex: 1, textAlign: 'right' }}>¥{data.tax.toFixed(2)}</Text>
        </View>

        <Text style={styles.total}>合计（含税）: ¥{data.total.toFixed(2)}</Text>

        <Text style={styles.note}>
          本发票由 Pontai 系统自动生成，正式税务发票请以税局打印版为准。
        </Text>
      </Page>
    </Document>
  );
}
