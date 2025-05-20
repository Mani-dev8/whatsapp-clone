import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import tw from 'twrnc';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useState} from 'react';
import {useRegisterMutation} from '../store/apiSlice';
import {useDispatch} from 'react-redux';
import {STORAGE_KEYS, storageUtils} from '../utils/storage';
import {initSocket} from '../utils/socket';
import PrimaryButton from '../components/commons/PrimaryButton';
import {WhatsappIcon} from '../assets/svg/Icon';
import PrimaryTextInput from '../components/commons/PrimaryTextInput';
import TextPasswordInput from '../components/commons/TextPasswordInput';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen({navigation}: any) {
  const [register, {isLoading, error}] = useRegisterMutation();
  const dispatch = useDispatch();

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async ({name, email, password}: SignupForm) => {
    try {
      const response = await register({name, email, password}).unwrap();
      storageUtils.setItem(STORAGE_KEYS.TOKEN, response.token);
      storageUtils.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      dispatch({type: 'auth/login', payload: response});
      await initSocket();
      navigation.navigate('Home');
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-white`}>
      <ScrollView
        contentContainerStyle={tw`flex-grow justify-center`}
        keyboardShouldPersistTaps="handled">
        <WhatsappIcon style={tw`mx-auto`} />
        <View style={tw`px-6 py-8`}>
          <Text style={tw`text-2xl font-bold text-[#128C7E] mb-8 text-center`}>
            Create Account
          </Text>

          <View style={tw`gap-y-2`}>
            {/* Name Input */}
            <View>
              <Controller
                control={control}
                name="name"
                render={({field: {onChange, value}}) => (
                  <PrimaryTextInput
                    placeholder="Full Name"
                    value={value}
                    onChangeText={onChange}
                    showError={!!errors.name}
                    errorMessage={errors.name?.message}
                  />
                )}
              />
            </View>

            {/* Email Input */}
            <View>
              <Controller
                control={control}
                name="email"
                render={({field: {onChange, value}}) => (
                  <PrimaryTextInput
                    placeholder="Email"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    showError={!!errors.email}
                    errorMessage={errors.email?.message}
                  />
                )}
              />
            </View>

            {/* Password Input */}
            <View>
              <Controller
                control={control}
                name="password"
                render={({field: {onChange, value}}) => (
                  <TextPasswordInput
                    value={value}
                    onChangeText={onChange}
                    showError={!!errors.password}
                    errorMessage={errors.password?.message}
                  />
                )}
              />
            </View>

            {/* Submit Button */}
            <PrimaryButton
              title="Sign Up"
              onPress={handleSubmit(onSubmit)}
              style="mt-6"
            />

            {/* Login Link */}
            <View style={tw`flex-row justify-center mt-4`}>
              <Text style={tw`text-gray-600`}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.replace('Login')}>
                <Text style={tw`text-[#128C7E] font-semibold`}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
