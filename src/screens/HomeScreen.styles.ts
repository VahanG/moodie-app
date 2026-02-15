import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pager: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  page: {
    flex: 1,
  },
  settingsContent: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  affirmationPage: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  affirmationContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  affirmationImage: {
    width: '100%',
    height: '72%',
    borderRadius: 24,
  },
  affirmationText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#4b5563',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  value: {
    marginTop: 4,
    fontSize: 13,
    color: '#4b5563',
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputBlock: {
    flex: 1,
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  status: {
    fontSize: 13,
    color: '#2563eb',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pageDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  pageDotActive: {
    backgroundColor: '#2563eb',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
