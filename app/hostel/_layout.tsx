import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function HostelLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal', contentStyle: { backgroundColor: Colors.bg } }} />;
}
