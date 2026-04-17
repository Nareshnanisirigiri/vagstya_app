import { createContext, useContext, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";

const SnackbarContext = createContext(null);

export function SnackbarProvider({ children }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const value = useMemo(() => {
    function showMessage(text, duration = 2000) {
      setMessage(text);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 80, duration: 220, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(() => {
          setVisible(false);
          setMessage("");
        });
      }, duration);
    }

    return { showMessage };
  }, [opacity, translateY]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {visible ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.snack}>
            <Text style={styles.text}>{message}</Text>
          </View>
        </Animated.View>
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used inside SnackbarProvider");
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    zIndex: 999,
  },
  snack: {
    backgroundColor: "rgba(10, 34, 22, 0.96)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    maxWidth: "90%",
    ...(Platform.OS === "web" ? { boxShadow: "0 10px 28px rgba(0,0,0,0.25)" } : {}),
  },
  text: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});

