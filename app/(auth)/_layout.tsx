import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="user-type" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="landlord-register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
