import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import  Entypo  from 'react-native-vector-icons/Entypo';
import { toast } from 'sonner-native';
import tw from 'twrnc';

export default function HomeScreen() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('Nigeria');
    const [countryCode, setCountryCode] = useState('+234');

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const handleNext = () => {
        if (!phoneNumber.trim() || !email.trim()) {
            toast.error('Please fill in all fields');
            return;
        }
        // Handle verification logic here
        toast.success('Verification code sent!');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
        >
            <View style={tw`flex-1 px-4 pt-12`}>
                {/* Header */}
                <View style={tw`flex-row justify-between items-center mb-8`}>
                    <Text style={tw`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Enter your phone number
                    </Text>
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleDarkMode}
                        trackColor={{ false: '#767577', true: '#075E54' }}
                        thumbColor={isDarkMode ? '#128C7E' : '#f4f3f4'}
                    />
                </View>

                {/* Description */}
                <Text style={tw`text-base mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    WhatsApp will need to verify your phone number and email. Carrier charges may apply.
                </Text>

                {/* Country Selector */}
                <TouchableOpacity
                    style={tw`flex-row justify-between items-center py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
                >
                    <Text style={tw`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedCountry}
                    </Text>
                    <Entypo
                        name="chevron-down"
                        size={24}
                        color={isDarkMode ? '#fff' : '#000'}
                    />
                </TouchableOpacity>

                {/* Phone Input */}
                <View style={tw`flex-row mt-4`}>
                    <TextInput
                        style={tw`flex-2 text-lg border-b mr-2 ${isDarkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-300'}`}
                        value={countryCode}
                        editable={false}
                    />
                    <TextInput
                        style={tw`flex-5 text-lg border-b ${isDarkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-300'}`}
                        placeholder="Phone number"
                        placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                    />
                </View>

                {/* Email Input */}
                <TextInput
                    style={tw`text-lg border-b mt-4 ${isDarkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-300'}`}
                    placeholder="Email address"
                    placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                {/* Next Button */}
                <TouchableOpacity
                    style={tw`mt-8 bg-[#128C7E] py-4 rounded-full`}
                    onPress={handleNext}
                >
                    <Text style={tw`text-white text-center text-lg font-semibold`}>
                        Next
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}