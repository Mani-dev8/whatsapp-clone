/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        '2xs': '10px',
      },
      fontFamily: {
        Thin: ['Roboto-Thin', 'sans-serif'], //100
        Light: ['Roboto-Light', 'sans-serif'], //300
        Regular: ['Roboto-Regular', 'sans-serif'], //400
        Medium: ['Roboto-Medium', 'sans-serif'], //500
        Bold: ['Roboto-Bold', 'sans-serif'], //700
        Black: ['Roboto-Black', 'sans-serif'], //900
      },
      colors: {
        
      },
    },
  },
  plugins: [
      plugin(({addUtilities}) => {
        addUtilities({
          'app-header-title-style': 'text-lg font-Regular',
        });
      }),
  ],
};
