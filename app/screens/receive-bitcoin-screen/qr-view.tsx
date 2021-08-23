import Clipboard from "@react-native-community/clipboard"
import { StackNavigationProp } from "@react-navigation/stack"
import LottieView from "lottie-react-native"
import * as React from "react"
import { useCallback, useMemo } from "react"
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Share,
  Text,
  View,
} from "react-native"
import { Button } from "react-native-elements"
import EStyleSheet from "react-native-extended-stylesheet"
import QRCode from "react-native-qrcode-svg"
import Toast from "react-native-root-toast"
import Icon from "react-native-vector-icons/Ionicons"
import { translate } from "../../i18n"
import { MoveMoneyStackParamList } from "../../navigation/stack-param-lists"
import { palette } from "../../theme/palette"
import { getFullUri as getFullUriUtil, TYPE_LIGHTNING, TYPE_BITCOIN } from "./utils"

// eslint-disable-next-line @typescript-eslint/no-var-requires
const successLottie = require("../move-money-screen/success_lottie.json")

const configByType = {
  [TYPE_LIGHTNING]: {
    copyToClipboardLabel: "ReceiveBitcoinScreen.copyClipboard",
    shareButtonLabel: "common.shareLightning",
    ecl: "L" as const,
    icon: "ios-flash",
  },
  [TYPE_BITCOIN]: {
    copyToClipboardLabel: "ReceiveBitcoinScreen.copyClipboardBitcoin",
    shareButtonLabel: "common.shareBitcoin",
    ecl: "M" as const,
    icon: "logo-bitcoin",
  },
}

type Props = {
  data: string
  type: GetFullUriInput["type"]
  amount: GetFullUriInput["amount"]
  memo: GetFullUriInput["memo"]
  keyboardIsShown: boolean
  loading: boolean
  isSucceed: boolean
  navigation: StackNavigationProp<MoveMoneyStackParamList, "receiveBitcoin">
  err: string
}

export const QRView = ({
  data,
  type,
  amount,
  memo,
  keyboardIsShown,
  loading,
  isSucceed,
  navigation,
  err,
}: Props): JSX.Element => {
  const isReady = useMemo(
    () => (type === TYPE_LIGHTNING ? !loading && data !== "" && !keyboardIsShown : true),
    [data, keyboardIsShown, loading, type],
  )

  const getFullUri = useCallback(
    ({ input, uppercase = false, prefix = true }) =>
      getFullUriUtil({ type, amount, memo, input, uppercase, prefix }),
    [type, amount, memo],
  )

  const copyToClipboard = useCallback(() => {
    Clipboard.setString(getFullUri({ input: data, prefix: false }))

    if (Platform.OS === "ios") {
      const stringToShow = configByType[type].copyToClipboardLabel

      Toast.show(translate(stringToShow), {
        duration: Toast.durations.LONG,
        shadow: false,
        animation: true,
        hideOnPress: true,
        delay: 0,
        position: -100,
        opacity: 0.5,
      })
    }
  }, [data, getFullUri, type])

  const share = useCallback(async () => {
    try {
      const result = await Share.share({
        message: getFullUri({ input: data, prefix: false }),
      })

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert(error.message)
    }
  }, [data, getFullUri])

  const dataOneLiner = useCallback(() => {
    if (type === TYPE_LIGHTNING) {
      return data ? `${data.substr(0, 18)}...${data.substr(-18)}` : ""
    }
    return data
  }, [data, type])

  return (
    <>
      <View style={styles.qr}>
        {(isSucceed && (
          <LottieView
            source={successLottie}
            loop={false}
            autoPlay
            style={styles.lottie}
            resizeMode="cover"
          />
        )) ||
          (isReady && (
            <Pressable onPress={copyToClipboard}>
              <QRCode
                size={280}
                value={getFullUri({ input: data, uppercase: true })}
                logoBackgroundColor="white"
                ecl={configByType[type].ecl}
                // __DEV__ workaround for https://github.com/facebook/react-native/issues/26705
                logo={
                  !__DEV__ &&
                  Icon.getImageSourceSync(configByType[type].icon, 28, palette.orange)
                }
              />
            </Pressable>
          )) || (
            <View style={styles.errorContainer}>
              {(err !== "" && (
                // eslint-disable-next-line react-native/no-inline-styles
                <Text style={{ color: palette.red, alignSelf: "center" }} selectable>
                  {err}
                </Text>
              )) ||
                (keyboardIsShown && (
                  <Icon size={56} name="ios-flash" color={palette.orange} />
                )) || <ActivityIndicator size="large" color={palette.blue} />}
            </View>
          )}
        <Pressable onPress={copyToClipboard}>
          <Text style={styles.copyToClipboardText}>{dataOneLiner()}</Text>
        </Pressable>
        {(isSucceed && <Text>{translate("ReceiveBitcoinScreen.invoicePaid")}</Text>) ||
          (isReady && (
            <Pressable onPress={copyToClipboard}>
              <Text>{translate("ReceiveBitcoinScreen.tapQrCodeCopy")}</Text>
            </Pressable>
          )) || <Text> </Text>}
      </View>
      <Button
        buttonStyle={styles.buttonStyle}
        containerStyle={styles.buttonContainer}
        title={
          isSucceed
            ? translate("common.ok")
            : translate(configByType[type].shareButtonLabel)
        }
        onPress={isSucceed ? () => navigation.goBack() : share}
        disabled={!isReady}
        titleStyle={styles.buttonTitle}
      />
    </>
  )
}

const styles = EStyleSheet.create({
  buttonContainer: { marginHorizontal: 52, paddingVertical: 18 },

  buttonStyle: {
    backgroundColor: palette.lightBlue,
    borderRadius: 32,
  },

  buttonTitle: {
    fontWeight: "bold",
  },

  copyToClipboardText: { textAlign: "center" },

  errorContainer: {
    alignContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: palette.white,
    height: 280,
    justifyContent: "center",
    width: 280,
  },

  lottie: {
    height: "200rem",
    width: "200rem",
    // backgroundColor: 'red',
  },

  qr: {
    // paddingTop: "12rem",
    alignItems: "center",
    // flex: 1,
  },
})
