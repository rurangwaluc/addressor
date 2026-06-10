import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AddressorThemeProvider, useAddressorTheme } from "../src/theme/theme";

function AddressorStack() {
  const theme = useAddressorTheme();

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: theme.bg,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AddressorThemeProvider>
      <AddressorStack />
    </AddressorThemeProvider>
  );
}

// import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import WebMobilePreview from "../src/components/WebMobilePreview";
// import { AddressorThemeProvider, useAddressorTheme } from "../src/theme/theme";

// function AddressorStack() {
//   const theme = useAddressorTheme();

//   return (
//     <WebMobilePreview>
//       <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
//       <Stack
//         screenOptions={{
//           headerShown: false,
//           animation: "slide_from_right",
//           contentStyle: {
//             backgroundColor: theme.bg,
//           },
//         }}
//       />
//     </WebMobilePreview>
//   );
// }

// export default function RootLayout() {
//   return (
//     <AddressorThemeProvider>
//       <AddressorStack />
//     </AddressorThemeProvider>
//   );
// }