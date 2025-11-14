# Mobile (Expo) — local start helpers

This project uses Expo. Two convenient npm scripts are added to help when your machine is connected to a VPN which causes Expo to pick a VPN interface (utun) IP instead of your LAN IP.

Usage (macOS)

- Start Expo and force the LAN IP (en0):

```zsh
npm run start:lan
```

This runs Expo with the environment variable REACT_NATIVE_PACKAGER_HOSTNAME set to the IP returned by `ipconfig getifaddr en0`, so Metro advertises an exp:// URL using your Wi‑Fi/LAN address.

- Use a tunnel (works when devices cannot reach your LAN):

```zsh
npm run start:tunnel
```

Notes
- These scripts assume a macOS environment and that your primary Wi‑Fi interface is `en0`.
- If you have a different active interface, replace `ipconfig getifaddr en0` with the appropriate command or hardcode the IP.
- If Expo still advertises the VPN IP, try disconnecting the VPN temporarily or use the tunnel script above.
