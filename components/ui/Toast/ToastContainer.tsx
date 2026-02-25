import { Toast } from "@/components/context/ToastContext";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
    toasts: Toast[];
    removeToast: (id: string) => void;
}

export const ToastContainer = ({ toasts, removeToast }: Props) => {
    return (
        <View style={styles.container}>
            {toasts.map((toast) => (
                <AnimatedToast
                    key={toast.id}
                    toast={toast}
                    removeToast={removeToast}
                />
            ))}
        </View>
    );
};

const AnimatedToast = ({
    toast,
    removeToast,
}: {
    toast: Toast;
    removeToast: (id: string) => void;
}) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -30,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                removeToast(toast.id);
            });
        }, 3500);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    transform: [{ translateY }],
                    opacity,
                },
                toast.type === "success" && styles.success,
                toast.type === "error" && styles.error,
                toast.type === "warning" && styles.warning,
                toast.type === "info" && styles.info,
            ]}
        >
            <Pressable onPress={() => removeToast(toast.id)}>
                <Text style={styles.text}>{toast.message}</Text>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        elevation: 9999,
    },
    toast: {
        padding: 14,
        borderRadius: 8,
        marginBottom: 10,
    },
    text: {
        color: "white",
        fontWeight: "500",
    },
    success: {
        backgroundColor: "#16a34a",
    },
    error: {
        backgroundColor: "#dc2626",
    },
    warning: {
        backgroundColor: "#ca8a04",
    },
    info: {
        backgroundColor: "#2563eb",
    },
});