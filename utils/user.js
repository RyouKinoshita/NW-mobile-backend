import AsyncStorage from "@react-native-async-storage/async-storage";

export const authenticate = async (data) => {

    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user))

}

export const getUser = () => {

    const user = AsyncStorage.getItem('user');
    return user ? user : null

}

export const getToken = () => {
    
    const token = AsyncStorage.getItem('token');
    return token ? token : null
    
}