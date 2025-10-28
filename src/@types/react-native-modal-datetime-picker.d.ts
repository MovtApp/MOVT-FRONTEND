declare module "react-native-modal-datetime-picker" {
  import { Component } from "react";
  import { ViewStyle } from "react-native";

  export interface DateTimePickerModalProps {
    isVisible: boolean;
    mode?: "date" | "time" | "datetime";
    date?: Date;
    maximumDate?: Date;
    minimumDate?: Date;
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    locale?: string;
    cancelTextIOS?: string;
    confirmTextIOS?: string;
    style?: ViewStyle;
  }

  export default class DateTimePickerModal extends Component<DateTimePickerModalProps> {}
}
