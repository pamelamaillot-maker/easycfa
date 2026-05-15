import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  box: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 6,
    marginTop: 1,
    backgroundColor: 'white',
  },
  boxChecked: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#006B68',
    marginRight: 6,
    marginTop: 1,
    backgroundColor: '#006B68',
  },
  label: {
    fontSize: 8,
    flex: 1,
    lineHeight: 1.5,
  },
  labelBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
    lineHeight: 1.5,
  },
});

type Props = {
  label: string;
  checked?: boolean;
  bold?: boolean;
};

export default function PdfCheckBox({ label, checked = false, bold = false }: Props) {
  return (
    <View style={styles.row}>
      <View style={checked ? styles.boxChecked : styles.box} />
      <Text style={bold ? styles.labelBold : styles.label}>{label}</Text>
    </View>
  );
}