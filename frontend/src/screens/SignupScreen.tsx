import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import tw from 'twrnc';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useRegisterMutation } from '../store/apiSlice';
import { useDispatch } from 'react-redux';
import { STORAGE_KEYS, storageUtils } from '../utils/storage';
import { initSocket } from '../utils/socket';

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen({ navigation }: any) {
    const [showPassword, setShowPassword] = useState(false);
    const [register, { isLoading, error }] = useRegisterMutation();
    const dispatch = useDispatch();

    const { control, handleSubmit, formState: { errors } } = useForm<SignupForm>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    });

    const onSubmit = async ({ name, email, password }: SignupForm) => {
        try {
            const response = await register({ name, email, password }).unwrap();
            storageUtils.setItem(STORAGE_KEYS.TOKEN, response.token);
            storageUtils.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
            dispatch({ type: 'auth/login', payload: response });
            await initSocket();
            navigation.navigate('Home');
        } catch (err) {
            console.error('Register error:', err);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-white`}
        >
            <ScrollView
                contentContainerStyle={tw`flex-grow justify-center`}
                keyboardShouldPersistTaps="handled"
            >
                <View style={tw`px-6 py-8`}>
                    <Text style={tw`text-2xl font-bold text-[#128C7E] mb-8 text-center`}>
                        Create Account
                    </Text>

                    <View style={tw`space-y-4`}>
                        {/* Name Input */}
                        <View>
                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        placeholder="Full Name"
                                        value={value}
                                        onChangeText={onChange}
                                        style={tw`border-b border-gray-300 p-3 text-base`}
                                        placeholderTextColor="#666"
                                    />
                                )}
                            />
                            {errors.name && (
                                <Text style={tw`text-red-500 text-sm mt-1`}>{errors.name.message}</Text>
                            )}
                        </View>

                        {/* Email Input */}
                        <View>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        placeholder="Email"
                                        value={value}
                                        onChangeText={onChange}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        style={tw`border-b border-gray-300 p-3 text-base`}
                                        placeholderTextColor="#666"
                                    />
                                )}
                            />
                            {errors.email && (
                                <Text style={tw`text-red-500 text-sm mt-1`}>{errors.email.message}</Text>
                            )}
                        </View>

                        {/* Password Input */}
                        <View>
                            <View style={tw`flex-row items-center border-b border-gray-300`}>
                                <Controller
                                    control={control}
                                    name="password"
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            placeholder="Password"
                                            value={value}
                                            onChangeText={onChange}
                                            secureTextEntry={!showPassword}
                                            style={tw`flex-1 p-3 text-base`}
                                            placeholderTextColor="#666"
                                        />
                                    )}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={tw`px-3`}
                                >
                                    <MaterialCommunityIcons
                                        name={showPassword ? 'eye-off' : 'eye'}
                                        size={24}
                                        color="#128C7E"
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <Text style={tw`text-red-500 text-sm mt-1`}>{errors.password.message}</Text>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSubmit(onSubmit)}
                            style={tw`bg-[#128C7E] py-4 rounded-lg mt-6`}
                        >
                            <Text style={tw`text-white text-center text-lg font-semibold`}>
                                Sign Up
                            </Text>
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={tw`flex-row justify-center mt-4`}>
                            <Text style={tw`text-gray-600`}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={tw`text-[#128C7E] font-semibold`}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}