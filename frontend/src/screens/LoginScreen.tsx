import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import tw from 'twrnc';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { toast } from 'sonner-native';
import { LoginFormData, loginSchema } from '../utils/validation';

export default function LoginScreen() {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = (data: LoginFormData) => {
        // Here you would typically make an API call to authenticate
        console.log(data);
        toast.success('Login successful!');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-[#ffffff]`}
        >
            <View style={tw`flex-1 justify-center px-6`}>
                {/* Logo and Welcome Text */}
                <View style={tw`items-center mb-8`}>
                    <MaterialCommunityIcons name="whatsapp" size={80} color="#25D366" />
                    <Text style={tw`text-2xl font-bold mt-4 text-gray-800`}>Welcome back</Text>
                    <Text style={tw`text-gray-600 mt-2`}>Sign in to your account</Text>
                </View>

                {/* Form */}
                <View style={tw`space-y-4`}>
                    <View>
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    placeholder="Email"
                                    value={value}
                                    onChangeText={onChange}
                                    style={tw`bg-gray-50 p-4 rounded-lg border border-gray-200`}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            )}
                        />
                        {errors.email && (
                            <Text style={tw`text-red-500 text-sm mt-1`}>{errors.email.message}</Text>
                        )}
                    </View>

                    <View>
                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    placeholder="Password"
                                    value={value}
                                    onChangeText={onChange}
                                    secureTextEntry
                                    style={tw`bg-gray-50 p-4 rounded-lg border border-gray-200`}
                                />
                            )}
                        />
                        {errors.password && (
                            <Text style={tw`text-red-500 text-sm mt-1`}>{errors.password.message}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={tw`bg-[#25D366] p-4 rounded-lg mt-4`}
                        onPress={handleSubmit(onSubmit)}
                    >
                        <Text style={tw`text-white text-center font-semibold text-lg`}>Sign In</Text>
                    </TouchableOpacity>
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
                        <TouchableOpacity>
                            <Text style={tw`text-[#25D366] font-semibold`}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}