import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, useForm} from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useDispatch} from 'react-redux';
import tw from 'twrnc';
import {WhatsappIcon} from '../assets/svg/Icon';
import PrimaryButton from '../components/commons/PrimaryButton';
import PrimaryTextInput from '../components/commons/PrimaryTextInput';
import TextPasswordInput from '../components/commons/TextPasswordInput';
import {useLoginMutation} from '../store/apiSlice';
import {initSocket} from '../utils/socket';
import {STORAGE_KEYS, storageUtils} from '../utils/storage';
import {LoginFormData, loginSchema} from '../utils/validation';
import {toast} from 'sonner-native';

export default function LoginScreen({navigation}: any) {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [login, {isLoading, error}] = useLoginMutation();
  const dispatch = useDispatch();

  const onSubmit = async ({email, password}: LoginFormData) => {
    try {
      const response = await login({email, password}).unwrap();
      storageUtils.setItem(STORAGE_KEYS.TOKEN, response.token);
      storageUtils.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      dispatch({type: 'auth/login', payload: response});
      await initSocket();
      navigation.navigate('Home');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.data?.message) {
        toast.error(err.data.message);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-white`}>
      <ScrollView
        contentContainerStyle={tw`flex-grow justify-center`}
        keyboardShouldPersistTaps="handled">
        <View style={tw`items-center mb-8`}>
          <WhatsappIcon style={tw`mx-auto`} />
          {/* Logo and Welcome Text */}
          <Text style={tw`text-2xl font-bold mt-8 text-gray-800`}>
            Welcome back
          </Text>
          <Text style={tw`text-gray-600 mt-2`}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <View style={tw`gap-y-4 px-6 py-8`}>
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

          <PrimaryButton
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            style={tw`mt-6`}
          />
        </View>

        {/* Additional Options */}
        <View style={tw`mt-6`}>
          <TouchableOpacity>
            <Text style={tw`text-[#25D366] text-center font-semibold`}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <View style={tw`flex-row justify-center mt-4`}>
            <Text style={tw`text-gray-600`}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={tw`text-[#25D366] font-semibold`}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
