import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function HomeScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <SafeAreaView style={tw`flex-1 bg-white dark:bg-gray-900`}>
            <View style={tw`flex-1 items-center justify-center px-6`}>
                {/* WhatsApp Icon Circle */}
                <View style={tw`mb-8`}>
                    <View style={tw`w-48 h-48 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center`}>
                        <MaterialCommunityIcons
                            name="whatsapp"
                            size={80}
                            color={isDarkMode ? '#0D9488' : '#10B981'}
                        />
                    </View>
                </View>

                {/* Welcome Text */}
                <Text style={tw`text-2xl font-bold mb-4 text-gray-900 dark:text-white`}>
                    Welcome to WhatsApp
                </Text>

                {/* Description Text */}
                <Text style={tw`text-center text-gray-600 dark:text-gray-400 mb-2`}>
                    Read our <Text style={tw`text-teal-600`}>Privacy Policy</Text>. Tap "Agree and continue"
                </Text>
                <Text style={tw`text-center text-gray-600 dark:text-gray-400 mb-8`}>
                    to accept the <Text style={tw`text-teal-600`}>Terms of Service</Text>.
                </Text>

                {/* Language Selector */}
                <TouchableOpacity
                    style={tw`flex-row items-center mb-8 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg`}
                >
                    <MaterialCommunityIcons
                        name="earth"
                        size={24}
                        color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    />
                    <Text style={tw`ml-2 text-gray-700 dark:text-gray-300`}>English</Text>
                    <MaterialCommunityIcons
                        name="chevron-down"
                        size={24}
                        color={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        style={tw`ml-2`}
                    />
                </TouchableOpacity>

                {/* Agree Button */}
                <TouchableOpacity
                    style={tw`w-full bg-teal-600 py-3 rounded-full`}
                >
                    <Text style={tw`text-white text-center font-semibold`}>
                        Agree and continue
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}