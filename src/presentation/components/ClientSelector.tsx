import { Colors } from "@/constants/theme";
import { ClientService } from "@/src/application/services/ClientService";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Client } from "@/src/domain/entities/Client";
import { MaterialIcons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import React, { useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient: (client: Client) => void;
  onClientCreated: () => void; // signal to reload list
}

export function ClientSelector({
  clients,
  selectedClientId,
  onSelectClient,
  onClientCreated,
}: Props) {
  const { darkMode } = useSettingsStore();
  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleSaveNew = async () => {
    if (!newName.trim()) return;

    const now = new Date().toISOString();
    const newClient: Client = {
      id: Crypto.randomUUID(),
      name: newName.trim(),
      phone: newPhone.trim() || "Sin teléfono",
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      isNew: true,
    };

    const service = new ClientService();
    await service.create(newClient);

    onClientCreated(); // tells parent to reload
    onSelectClient(newClient); // auto select

    setNewName("");
    setNewPhone("");
    setIsCreating(false);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.subtext }]}>
        Cliente Asignado *
      </Text>

      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            borderColor: colors.border,
            backgroundColor: darkMode ? colors.secondaryBackground : "#FAFAFA",
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            { color: colors.text },
            !selectedClient && { color: colors.subtext },
          ]}
        >
          {selectedClient
            ? selectedClient.name
            : "Toque para seleccionar un cliente..."}
        </Text>
        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={colors.subtext}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalContent, 
            { backgroundColor: colors.background, paddingTop: insets.top }
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isCreating ? "Nuevo Cliente" : "Seleccionar Cliente"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setIsCreating(false);
              }}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {isCreating ? (
            <View style={styles.formContainer}>
              <TextInput
                placeholder="Nombre completo *"
                placeholderTextColor={colors.subtext}
                value={newName}
                onChangeText={setNewName}
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: darkMode
                      ? colors.secondaryBackground
                      : "#FAFAFA",
                    color: colors.text,
                  },
                ]}
                autoFocus
              />
              <TextInput
                placeholder="Teléfono (Opcional)"
                placeholderTextColor={colors.subtext}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: darkMode
                      ? colors.secondaryBackground
                      : "#FAFAFA",
                    color: colors.text,
                  },
                ]}
              />
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.tint }]}
                onPress={handleSaveNew}
              >
                <Text style={styles.primaryButtonText}>
                  Guardar y Seleccionar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setIsCreating(false)}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: colors.tint }]}
                >
                  Volver a la lista
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                placeholder="Buscar cliente..."
                placeholderTextColor={colors.subtext}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[
                  styles.searchInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: darkMode
                      ? colors.secondaryBackground
                      : "#FAFAFA",
                    color: colors.text,
                  },
                ]}
              />

              <FlatList
                data={filteredClients}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>
                      No se encontraron clientes.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.clientRow,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => {
                      onSelectClient(item);
                      setModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.clientName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text
                        style={[styles.clientPhone, { color: colors.subtext }]}
                      >
                        {item.phone || "Sin teléfono"}
                      </Text>
                    </View>
                    {item.id === selectedClientId && (
                      <MaterialIcons
                        name="check"
                        size={24}
                        color={colors.tint}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />

              <View
                style={[
                  styles.footerContainer,
                  { borderTopColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={() => setIsCreating(true)}
                >
                  <Text style={styles.primaryButtonText}>
                    + Crear Nuevo Cliente
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  selectorText: {
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchInput: {
    margin: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  clientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  primaryButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  secondaryButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
