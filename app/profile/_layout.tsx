import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }} />;
}
