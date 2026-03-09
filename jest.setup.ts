// Silence some React Native warnings and console logs during tests if needed
import "react-native-gesture-handler/jestSetup";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Since we use Crypto for UUID manually in business logic, we mock it globally
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "mock-uuid-1234"),
}));
