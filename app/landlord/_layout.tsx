import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function LandlordStackLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: Colors.bg } }} />;
}
