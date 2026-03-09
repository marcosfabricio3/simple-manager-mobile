import { ClientService } from "@/src/application/services/ClientService";
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

    // We create directly bypassing the hook so we can instantly select it
    // In a larger app, we'd inject this via props, but this works nicely for Phase 4.5 fixes
    const now = new Date().toISOString();
    const newClient: Client = {
      id: Crypto.randomUUID(),
      name: newName.trim(),
      phone: newPhone.trim() || "Sin teléfono",
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    // Quick DB Insert via Service
    // We could use ClientService proper methods here if we added `create` to it
    // Wait, ClientService doesn't have `create`, only ClientRepository does.
    // Let's use the hook `useClients` properly. Wait, I can't from here if I don't pass it.
    // Since ClientRepository has it, let's just make ClientService proxy it.
    // I will add create to ClientService shortly.
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
      <Text style={styles.label}>Cliente Asignado *</Text>

      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedClient && styles.placeholderText,
          ]}
        >
          {selectedClient
            ? selectedClient.name
            : "Toque para seleccionar un cliente..."}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#8E8E93" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isCreating ? "Nuevo Cliente" : "Seleccionar Cliente"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setIsCreating(false);
              }}
            >
              <MaterialIcons name="close" size={24} color="#3A3A3C" />
            </TouchableOpacity>
          </View>

          {isCreating ? (
            <View style={styles.formContainer}>
              <TextInput
                placeholder="Nombre completo *"
                value={newName}
                onChangeText={setNewName}
                style={styles.input}
                autoFocus
              />
              <TextInput
                placeholder="Teléfono (Opcional)"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.primaryButton}
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
                <Text style={styles.secondaryButtonText}>
                  Volver a la lista
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                placeholder="Buscar cliente..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />

              <FlatList
                data={filteredClients}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No se encontraron clientes.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.clientRow}
                    onPress={() => {
                      onSelectClient(item);
                      setModalVisible(false);
                    }}
                  >
                    <View>
                      <Text style={styles.clientName}>{item.name}</Text>
                      <Text style={styles.clientPhone}>
                        {item.phone || "Sin teléfono"}
                      </Text>
                    </View>
                    {item.id === selectedClientId && (
                      <MaterialIcons name="check" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                )}
              />

              <View style={styles.footerContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
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
    color: "#8E8E93",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FAFAFA",
  },
  selectorText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  placeholderText: {
    color: "#8E8E93",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  searchInput: {
    margin: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
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
    borderBottomColor: "#F2F2F7",
  },
  clientName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: "#8E8E93",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#8E8E93",
    fontSize: 16,
  },
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
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
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  secondaryButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
