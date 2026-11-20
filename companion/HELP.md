## Vitrine

Controls [Vitrine](https://github.com/silvansan/Vitrine) guest media on vMix through the Vitrine agent on the vMix PC. Companion works like the back tablet.

### Setup

1. On the vMix PC, open the Vitrine settings page (tray icon → **Settings**, or `http://127.0.0.1:8090/companion`).
2. Under **Integrations (Bitfocus Companion)**, click **Create API key** and copy the key (shown once).
3. In this module: agent address (`127.0.0.1` if Companion runs on the vMix PC), port `8090`, and the key.
   If Companion runs on another PC, the agent has to listen on the LAN (`"listen": "0.0.0.0:8090"` in the agent's connection settings).

### Guests and files

Guests are numbered like the chips on the tablet (1 = first guest of the current service). Files are numbered in the guest's order, counting only files that are already on the vMix PC.

- **Select guest** picks the guest for the file buttons (guest number, next, previous).
- **Toggle file** works like a tap on the tablet: live, tap again → back to the default input. Guest `0` means the selected guest.
- **Take file** always puts it live. Videos and audio start from the start or where they were stopped (Resume).
- **Clear screen**, **Stop audio**, **Play / pause**, **Play from the start**, **Skip forward / back**, **Go to time**, **Jump to marker**, **Add marker here**.
- **Show guest on the pulpit tablet** and **Pulpit tablet: go to page**.

Presets: _Guests_ (a row of guest buttons), _Files of the selected guest_ (button text from `slot_N_label`, red while live, orange while being sent), _Screen_ (Clear screen, Now live), _Video and audio_, _Markers_, _Pulpit tablet_.

### Variables

`live_kind` is `none`, `photo`, `video` or `audio` (audio also when it plays behind the default input). Others: `live_name`, `live_guest`, `live_guest_name`, `live_file`, `on_screen_kind`, `audio_playing`, `playing`, `paused`, `position`, `duration`, `time_left`, `time_left_s`, `marker_count`, `marker_1`…`marker_8`, `guest_1`…, `selected_guest`, `selected_guest_name`, `slot_N_name`, `slot_N_kind`, `slot_N_label`, `slot_N_duration`, `pulpit_guest`, `pulpit_guest_name`, `service_name`, `connected`, `vmix_ok`.

### Lights and mics with triggers

Example: dim the lights and open the playback channel on the Wing while a video plays.

1. **Triggers → Add trigger**, event **On variable change** for `$(vitrine:live_kind)`.
2. Condition: **Internal: Variable: Check value** `$(vitrine:live_kind)` = `video`.
3. Actions: your DMX/lighting module (e.g. recall a scene) and your Behringer Wing module (e.g. unmute the playback channel).
4. A second trigger for `none` restores the lights and mutes the channel again.

Use the `time_left_s` variable to fade lights up a few seconds before a video ends.
