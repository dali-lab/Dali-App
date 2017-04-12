# DALI Lab App

A React-Native application for showing information pertinent to DALI Lab members. Runs on iOS and Android, and uses Bluetooth beacon monitoring to recognize when the device enters or exits the DALI Lab.

## Features

- Display the upcoming TA office hours
- Display upcoming events
- List the location of the people who share it
- Automatically check-in to events
- Interact with the lights when you enter and exit the lab

## Installation and Building

In order to build the application there are a couple of things to set-up

#### Set Up

You will need the following things installed:
- Homebrew
```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```
- react-native-cli
```bash
brew install react-native-cli
```

#### Installation

Clone the repository and install the necessary packages
```bash
git clone https://github.com/dali-lab/Dali-App.git dali-app
cd dali-app # change directory into main directory
npm install # install the packages
react-native link # Link all packages to the Xcode project and gradle
```

#### Building

Will not compile without components/Environment.js (contact John Kotz if you would like to develop for it).

###### iOS
*Xcode required*

__*Debug*__: use a development live reload server. This will also enable the \_\_DEV\_\_ variable.
```bash
react-native run-ios
```

__*Release*__: build for release. This will build the application to a releasable binary that will run independently from a development server.

>To build for release, open Xcode and switch the Scheme to dali-release. Select a destination device and run

###### Android
To run on an emulator, download AndroidStudio and create a device of your choice. Launch it and you can then run one of the following.

To run on a device, [enable developer mode](http://www.greenbot.com/article/2457986/how-to-enable-developer-options-on-your-android-phone-or-tablet.html) and [enable USB debugging](https://www.kingoapp.com/root-tutorials/how-to-enable-usb-debugging-mode-on-android.htm). Then when you plug in your device you can build to it.

NOTE: You cannot run using these methods if two Android phones are connected!

__*Debug*__: same as iOS. Android will connect to the development server through the cable, and this command will make that happen

```bash
react-native run-android
```

__*Release*__:

```bash
react-native run-android --variant release
```

## TODO
- Write descriptions for all files
