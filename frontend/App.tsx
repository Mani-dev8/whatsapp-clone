import React, {useEffect} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {Toaster} from 'sonner-native';
import tw from './src/libs/tailwind';
import RootNavigator from './src/navigation/RootNavigator';
import {persistor, store} from './src/store';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {statusBarWithWhiteBg} from './src/utils/helper';
import {MenuProvider} from 'react-native-popup-menu';

function App(): React.JSX.Element {
  useEffect(() => {
    statusBarWithWhiteBg();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={tw`flex-1 bg-white`}>
            <MenuProvider>
              <RootNavigator />
            </MenuProvider>
            <Toaster position="bottom-center" />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
