# GLUETUN – BẢN ĐỒ NGỮ CẢNH CỐT LÕI (dành cho AI đọc để tự dựng server riêng)

> Nguồn: quét trực tiếp mã nguồn `github.com/qdm12/gluetun` (module Go `github.com/qdm12/gluetun`, `go 1.26`, tổng ~1018 file trong zip).
> Mục đích: AI khác đọc file này là đủ biết **file nào cần đọc, file nào bỏ qua**, mà không phải quét lại toàn bộ repo.
> Mọi đường dẫn tính từ gốc repo. `(N dòng)` là số dòng thực tế của file (không tính test).

---

## 0. Cách dùng file này

1. Đọc mục **1** và **2** để hiểu ý tưởng + luồng chạy.
2. Đọc mục **3** để biết thứ tự ưu tiên (Tier 1 → Tier 3).
3. Chỉ mở những file ở **Tier 1** trước. Tier 2 mở khi cần tính năng tương ứng. Tier 3 gần như không cần.
4. Mục **11** liệt kê rõ những thứ **bỏ qua**.
5. Lưu ý quan trọng: **dữ liệu danh sách server của các VPN provider KHÔNG nằm trong repo này**, nó nằm trong Go module ngoài `github.com/qdm12/gluetun-servers` (xem mục 6.3 và 8).

---

## 1. Ý tưởng cốt lõi: "biến VPN provider thành proxy" hoạt động thế nào

Gluetun **không** viết một proxy riêng cho từng provider. Nó làm 3 việc tách biệt:

| Bước | Việc                                                                                                                                                                                                                                                               | Package chính                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| A    | Chọn 1 server của provider và dựng tunnel VPN (OpenVPN hoặc WireGuard/AmneziaWG) trong network namespace của process/container                                                                                                                                     | `provider/*`, `vpn`, `openvpn`, `wireguard`, `amneziawg` |
| B    | Ép **toàn bộ traffic đi ra ngoài** phải qua interface tunnel (`tun0`/`wg0`) bằng routing + firewall kill-switch (iptables policy `DROP`, chỉ cho phép: loopback, traffic tới IP server VPN, traffic ra qua interface VPN, mạng LAN/outbound subnets được cấu hình) | `routing`, `firewall`, `netlink`, `tun`                  |
| C    | Chạy các **proxy server thông thường** (HTTP, SOCKS5, Shadowsocks) lắng nghe trên interface LAN của container. Vì các proxy này chạy **cùng network namespace**, mọi kết nối đi ra của chúng tự động bị route qua tunnel VPN                                       | `httpproxy`, `socks5`, `shadowsocks`                     |

=> Kết luận quan trọng cho người tự dựng server: **phần "proxy" thực ra rất mỏng** (HTTP CONNECT proxy, SOCKS5 server, Shadowsocks server dùng lib ngoài). Phần "khó" và "cốt lõi" là: (1) chọn server + sinh config theo từng provider, (2) dựng tunnel + routing + firewall đúng thứ tự, (3) vòng đời tự phục hồi (healthcheck → restart VPN).

Các proxy KHÔNG bind vào interface tunnel. Chúng lắng nghe `:8888` (HTTP), `:1080` (SOCKS5), `:8388` (Shadowsocks) trên interface mặc định. Client bên ngoài kết nối vào đó, còn kết nối đi ra internet của proxy thì đi qua VPN nhờ default route + firewall.

---

## 2. Luồng chạy end-to-end (đọc theo `cmd/gluetun/main.go`, hàm `_main`)

Thứ tự khởi tạo thực tế (đã đối chiếu với code):

1. Tạo `netlink.New(...)`, `command.New()`, `cli.New()`, tạo `reader` đọc settings từ 3 nguồn theo thứ tự: `secrets` → `files` → `env`.
2. Nếu có tham số CLI → chạy subcommand rồi thoát: `healthcheck`, `clientkey`, `openvpnconfig`, `update`, `format-servers`, `genkey`.
3. `allSettings.Read(reader, logger)` → `SetDefaults()` → set log level.
4. `routing.New(...)` → `DefaultRoutes()` + `LocalNetworks()` (đọc routing table hiện có của container _trước khi_ VPN lên).
5. `firewall.NewConfig(...)` (tự chọn iptables implementation) → nếu `Firewall.Enabled` thì `SetEnabled(true)` (bật kill-switch ngay).
6. `storage.New(...)` nạp danh sách server (embedded + file trên đĩa).
7. `netLinker.FindIPv6SupportLevel(...)`, rồi `allSettings.Validate(storage, ipv6Supported, logger)` (validate cần danh sách server để kiểm tra country/city/hostname hợp lệ).
8. Tạo user không root (`alpine.CreateUser`), `routingConf.Setup()` (cần `NET_ADMIN`), set outbound subnets cho firewall + routing, mở `FIREWALL_INPUT_PORTS`.
9. Khởi động các loop phụ: `portforward.NewLoop` → `dns.NewLoop` (+ ticker) → `publicip.NewLoop` → `socks5.NewLoop` → `healthcheck.NewServer` + `NewChecker`.
10. Tạo `provider.NewProviders(storage, ...)` (registry tất cả provider) và `vpn.NewLoop(...)` → `go vpnLooper.Run(...)`.
11. Khởi động `metrics`, `updater.NewLoop` (+ ticker), `httpproxy.NewLoop`, `shadowsocks.NewLoop`, control `server.New(...)`.
12. `vpnLooper.ApplyStatus(ctx, constants.Running)` – **chặn cho tới khi VPN chạy**.
13. Shutdown theo thứ tự bằng `goshutdown` (control → tickers → healthserver → vpn → other).

### Vòng đời một lần kết nối VPN (`internal/vpn/run.go` → `Loop.Run`)

```
Loop.Run:
  settings := state.GetSettings()
  providerConf := providers.Get(settings.Provider.Name)
  switch settings.Type:
    openvpn   -> setupOpenVPN   (vpn/openvpn.go)
    wireguard -> setupWireguard (vpn/wireguard.go)
    amneziawg -> setupAmneziaWg (vpn/amneziawg.go)
  go vpnRunner.Run(vpnCtx, waitError, tunnelReady)
  chờ tunnelReady -> go onTunnelUp(...)   (vpn/tunnelup.go)
  lỗi -> crashed() -> backoff (mặc định 15s, nhân đôi) -> lặp lại, provider sẽ chọn server kế tiếp
```

`setupOpenVPN` (vpn/openvpn.go): `tun.Setup()` → `providerConf.GetConnection(selection, ipv6)` → `providerConf.OpenVPNConfig(connection, settings, ipv6)` → `openvpnConf.WriteConfig(lines)` (ghi `/etc/openvpn/target.ovpn`) → `WriteAuthFile` / `WriteAskPassFile` → `fw.SetVPNConnection(ctx, connection, iface)` → `openvpn.NewRunner(...)`.

`setupWireguard` (vpn/wireguard.go): `GetConnection` → `buildWireguardSettings` (MTU mặc định 1320, rule priority 101, lọc IPv6 nếu không hỗ trợ) → `wireguard.New(...)` → `fw.SetVPNConnection(...)`.

`onTunnelUp` (vpn/tunnelup.go), chạy khi tunnel sẵn sàng: mở `VPN_INPUT_PORTS` trên interface VPN → PMTUD (tìm MTU tối đa, set TCP MSS) → bật DNS loop → khởi động healthchecker (fail → `restartVPN`) → lấy public IP → chạy `VPN_UP_COMMAND` → bật port forwarding → boringpoll.

Tín hiệu "tunnel ready" của OpenVPN = dòng log `Initialization Sequence Completed` (`openvpn/stream.go`).

---

## 3. Phân tầng ưu tiên

### TIER 1 – BẮT BUỘC đọc (lõi của "VPN provider → proxy")

| #   | Đường dẫn                                                                                                                                 | Vai trò                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | `cmd/gluetun/main.go` (649 dòng)                                                                                                          | Sơ đồ wiring toàn bộ hệ thống, thứ tự khởi tạo/shutdown                                                             |
| 2   | `internal/provider/provider.go`, `internal/provider/providers.go`                                                                         | Interface `Provider` + registry `NewProviders`                                                                      |
| 3   | `internal/provider/utils/` (`connection.go`, `pick.go`, `openvpn.go`, `tier.go`, `port.go`, `protocol.go`, `cipher.go`, `portforward.go`) | Logic dùng chung: lọc server → chọn connection → sinh config OpenVPN                                                |
| 4   | `internal/provider/mullvad/`, `internal/provider/example/`                                                                                | Provider mẫu nhỏ nhất (template khi thêm provider mới)                                                              |
| 5   | `internal/provider/custom/`                                                                                                               | Provider "tự mang config" (OpenVPN file / WireGuard thủ công) – quan trọng nếu server riêng dùng config tự cung cấp |
| 6   | `internal/models/` (`server.go`, `servers.go`, `connection.go`, `filters.go`)                                                             | Cấu trúc dữ liệu `Server`, `Connection`, `AllServers`                                                               |
| 7   | `internal/storage/`                                                                                                                       | Nạp/lọc/gộp/ghi danh sách server (`filter.go`, `hardcoded.go`, `read.go`, `merge.go`, `flush.go`, `sync.go`)        |
| 8   | `internal/vpn/`                                                                                                                           | Orchestrator vòng đời tunnel                                                                                        |
| 9   | `internal/openvpn/` (không gồm `pkcs8/`, `extract/` nếu không dùng custom config)                                                         | Chạy tiến trình `openvpn`                                                                                           |
| 10  | `internal/wireguard/`                                                                                                                     | WireGuard kernelspace + userspace                                                                                   |
| 11  | `internal/tun/`, `internal/netlink/`, `internal/routing/`                                                                                 | Interface tun, thao tác route/rule/link/addr qua netlink                                                            |
| 12  | `internal/firewall/` + `internal/firewall/iptables/`                                                                                      | Kill-switch iptables                                                                                                |
| 13  | `internal/httpproxy/`, `internal/socks5/`, `internal/shadowsocks/`                                                                        | 3 loại proxy                                                                                                        |
| 14  | `internal/configuration/settings/`                                                                                                        | Toàn bộ cấu hình + validate + default + đọc env                                                                     |
| 15  | `internal/loopstate/`                                                                                                                     | Máy trạng thái chuẩn cho mọi "loop" (Start/Stop/Status)                                                             |
| 16  | `internal/constants/` (`providers/providers.go`, `vpn/protocol.go`, `openvpn/*`, `status.go`, `protocol.go`)                              | Hằng số tên provider, loại VPN, trạng thái                                                                          |

### TIER 2 – Đọc khi cần tính năng tương ứng

| Đường dẫn                                                                                                     | Khi nào cần                                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `internal/dns/` + `internal/dns/state/`                                                                       | Muốn DNS-over-TLS/blocklist nội bộ, tránh DNS leak                                                                   |
| `internal/healthcheck/` (+ `dns/`, `icmp/`)                                                                   | Tự phục hồi: kiểm tra tunnel sống, restart VPN                                                                       |
| `internal/publicip/` (+ `api/`)                                                                               | Lấy public IP/geo sau khi VPN lên                                                                                    |
| `internal/portforward/` (+ `service/`)                                                                        | Port forwarding (PIA, PrivateVPN, ProtonVPN)                                                                         |
| `internal/server/` (+ `middlewares/`) và `internal/httpserver/`                                               | REST control API (`/v1/vpn/status`, ...) đổi server/bật tắt VPN lúc runtime                                          |
| `internal/updater/` (+ `loop/`, `resolver/`, `unzip/`, `html/`, `openvpn/`) và `internal/provider/*/updater/` | Tự cập nhật danh sách server từ API/file của provider                                                                |
| `internal/pmtud/`                                                                                             | Tự dò MTU tối ưu (chỉ OpenVPN, hoặc WireGuard khi MTU=0)                                                             |
| `internal/command/`                                                                                           | Wrapper chạy lệnh ngoài (openvpn, iptables, up/down command)                                                         |
| `internal/cli/`                                                                                               | Subcommand `healthcheck`, `update`, `openvpnconfig`, `genkey`, `clientkey`, `format-servers`                         |
| `internal/amneziawg/`                                                                                         | Biến thể WireGuard chống DPI (chỉ provider `custom`)                                                                 |
| `internal/openvpn/extract/`, `internal/openvpn/pkcs8/`                                                        | Đọc file `.ovpn` tùy chỉnh, giải mã private key PKCS8                                                                |
| `internal/alpine/`                                                                                            | Tạo user không root (`CreateUser`), đọc version Alpine                                                               |
| `internal/restrictednet/`                                                                                     | Client HTTP/DNS cho mạng hạn chế. **Không package nào trong repo import nó** (đã grep) → có thể bỏ qua               |
| `internal/natpmp/`                                                                                            | Client NAT-PMP. Chỉ được `provider/protonvpn/portforward.go` import (đã grep)                                        |
| `internal/mod/`                                                                                               | Kiểm tra/load **kernel module** (ví dụ WireGuard) – dùng bởi `netlink`; **không phải** "module initialization hooks" |
| `internal/subnet/`                                                                                            | Tiện ích subnet                                                                                                      |
| `internal/cleanup/`                                                                                           | Tiện ích dọn dẹp tài nguyên                                                                                          |
| `internal/format/`                                                                                            | Format duration                                                                                                      |
| `internal/metrics/` + `metrics/`                                                                              | Prometheus + dashboard Grafana (tùy chọn)                                                                            |
| `internal/pprof/`                                                                                             | Profiling (tùy chọn)                                                                                                 |

### TIER 3 – Hầu như không cần

`internal/boringpoll/` (poll HTTP định kỳ tới `gluetun.com`, bật/tắt qua `BORINGPOLL_GLUETUNCOM`; **không phải** thư viện BoringSSL), `internal/version/`, `ci/`, `devrun/`, `.github/`, `.devcontainer/`, `.vscode/`, `doc/`, `title.svg`, `maintenance.md`, `AGENTS.md` (chỉ là quy ước viết code Go), toàn bộ `*_test.go`, `mocks_*_test.go`, `testdata/`.

---

## 4. Chi tiết từng module Tier 1

### 4.1 `cmd/gluetun/main.go`

- `main()`: bắt SIGINT/SIGTERM, chạy `_main` trong goroutine, shutdown có timeout 5s.
- `_main(...)`: toàn bộ wiring ở mục 2. Cũng định nghĩa các interface cục bộ `netLinker`, `Addresser`, `Router`, `Ruler`, `Linker`, `clier`, `RunStarter` (giúp hiểu những gì `netlink` và `command` phải cung cấp).
- Đây là file duy nhất cần đọc để thấy **toàn bộ dependency graph**.

### 4.2 Provider layer – `internal/provider/`

**Interface (`provider/provider.go`)**

```go
type Provider interface {
    GetConnection(selection settings.ServerSelection, ipv6Supported bool) (models.Connection, error)
    OpenVPNConfig(connection models.Connection, settings settings.OpenVPN, ipv6Supported bool) (lines []string)
    Name() string
    FetchServers(ctx context.Context, minServers int) ([]models.Server, error)
}
```

**Registry (`provider/providers.go`, 100 dòng)**: `NewProviders(storage, timeNow, updaterWarner, client, unzipper, parallelResolver, ipFetcher, extractor, credentials)` trả `*Providers` chứa `map[string]Provider`; `Get(name)` panic nếu không có. Có kiểm tra sanity: số provider phải bằng `len(providers.AllWithCustom())`.

**Cấu trúc mỗi provider** (ví dụ `provider/mullvad/`):

- `provider.go` – struct `Provider{ storage common.Storage; connPicker *utils.ConnectionPicker; common.Fetcher }`, `New(...)`, `Name()`.
- `connection.go` – `GetConnection` gọi `utils.GetConnection(name, storage, selection, utils.NewConnectionDefaults(tcpPort, udpPort, wgPort), ipv6Supported, connPicker)`. Mullvad dùng defaults `(0, 0, 51820)`.
- `openvpnconf.go` – `OpenVPNConfig` điền `utils.OpenVPNProviderSettings` (cipher, auth, CA, TLSAuth/TLSCrypt, mssfix, ping, ...) rồi gọi `utils.OpenVPNConfig(...)`. Mullvad **panic** vì đã bỏ OpenVPN từ 15/01/2026.
- `updater/` – triển khai `FetchServers` (gọi API/tải file/zip, resolve DNS song song) trả `[]models.Server`.

**Thư mục dùng chung**

- `provider/common/` – interface `Storage`, `Fetcher`, `ParallelResolver`, `Unzipper`, `Warner`, `IPFetcher`; lỗi `ErrNotEnoughServers`, `ErrCredentialsMissing`; (`mocks.go` chỉ để test).
- `provider/utils/connection.go` – `GetConnection`: `storage.FilterServers` → mode `random` (shuffle) hoặc `ordered` (`sortServersByTier`) → duyệt từng IP của từng server (bỏ IPv6 nếu không hỗ trợ; dùng `OvpnX509` làm hostname nếu có) → tạo `models.Connection` → ưu tiên IPv6 → `pickConnection`.
- `provider/utils/pick.go` – `ConnectionPicker`: xoay vòng (round-robin) qua pool connection; reset khi pool đổi (fingerprint FNV64). Nếu user đặt `ENDPOINT_IP`: OpenVPN thì ghi đè IP; WireGuard thì tìm connection có đúng IP đó (cần public key đúng).
- `provider/utils/openvpn.go` (360 dòng) – `OpenVPNProviderSettings` + `OpenVPNConfig(...)` sinh các dòng `.ovpn`; các hàm `WrapOpenvpnCA/Cert/Key/EncryptedKey/RSAKey/TLSAuth/TLSCrypt/CRLVerify`.
- `provider/utils/tier.go`, `port.go`, `protocol.go`, `cipher.go`, `nofetcher.go`, `logger.go`, `portforward.go` (`PortForwardObjects`).
- `provider/custom/` – `connection.go`, `openvpnconf.go`, `provider.go`, `interfaces.go`: đọc connection/config từ file `.ovpn` do user cung cấp (dùng `openvpn/extract`).
- `provider/privateinternetaccess/presets/`, `provider/surfshark/servers/` – dữ liệu preset đặc thù.

**Provider có `portforward.go`**: `privateinternetaccess` (529 dòng), `privatevpn`, `protonvpn`.

### 4.3 Dữ liệu server – `internal/models/` + `internal/storage/`

**`models.Server`** (`models/server.go`): `VPN, Country, Region, City, ISP, Categories, Owned, Number, ServerName, Hostname, TCP, UDP, OvpnX509, MultiHop, WgPubKey, Free, Premium, Stream, SecureCore, Tor, PortForward, Keep, IPs []netip.Addr`. Có `HasMinimumInformation()` (OpenVPN cần TCP||UDP; WireGuard cần `WgPubKey` và không đặt TCP/UDP), `Equal`, `Key()`.

**`models.Connection`** (`models/connection.go`): `Type, IP, Port, Protocol, Hostname, PubKey, ServerName, PortForward` + `UpdateEmptyWith`, `Equal`.

**`models.AllServers`/`Servers`** (`models/servers.go`, 182 dòng): `Version`, `ProviderToServers map[string]Servers`; mỗi `Servers` có `Version`, `Timestamp`, `Servers []Server`, `Filepath`.

**`storage/`**

- `storage.go` – `New(logger, disk bool, directoryPath, legacyFilepath)`; mặc định thư mục `/gluetun/servers/`, file `manifest.json`.
- `hardcoded.go` – `parseHardcodedServers`: đọc **embedded FS** `serversmodule.Files` (module ngoài `github.com/qdm12/gluetun-servers/pkg/servers`), mở `<provider>.json` cho từng provider trong `providers.All()`.
- `read.go`, `merge.go`, `flush.go`, `sync.go`, `copy.go`, `choices.go`, `formatting.go`, `servers.go`.
- `filter.go` (167 dòng) – `FilterServers(provider, selection)` áp dụng mọi bộ lọc của `ServerSelection`.

### 4.4 Cấu hình – `internal/configuration/`

`settings/settings.go` định nghĩa `Settings` gồm: `ControlServer, DNS, Firewall, Health, HTTPProxy, Log, Metrics, PublicIP, Socks5, Shadowsocks, Storage, System, Updater, Version, VPN, IPv6, Pprof, BoringPoll`. Mỗi phần có `Read(reader)`, `SetDefaults()`, `validate()`, `copy()`, `String()`.

File settings quan trọng nhất cho bài toán "VPN → proxy":

| File                                                                                                                                                                                                             | Nội dung                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settings/vpn.go` (173)                                                                                                                                                                                          | `VPN_TYPE`, up/down command, gộp provider+openvpn+wireguard                                                                                                                                                                       |
| `settings/provider.go` (138)                                                                                                                                                                                     | `VPN_SERVICE_PROVIDER` (`VPNSP`), validate tên provider **theo loại VPN** (xem mục 5)                                                                                                                                             |
| `settings/serverselection.go` (533)                                                                                                                                                                              | Bộ lọc server: country/region/city/ISP/hostname/name/category/number + cờ `FREE_ONLY`, `PREMIUM_ONLY`, `OWNED_ONLY`, `STREAM_ONLY`, `SECURE_CORE_ONLY`, `TOR_ONLY`, `MULTIHOP_ONLY`, `PORT_FORWARD_ONLY`; `SERVER_SELECTION_MODE` |
| `settings/openvpn.go` (433), `openvpnselection.go` (218)                                                                                                                                                         | Cấu hình OpenVPN, protocol/port/endpoint                                                                                                                                                                                          |
| `settings/wireguard.go` (299), `wireguardselection.go` (172)                                                                                                                                                     | Khóa, địa chỉ, MTU, allowed IPs, keepalive, endpoint                                                                                                                                                                              |
| `settings/amneziawg.go`                                                                                                                                                                                          | Tham số AmneziaWG (`AMNEZIAWG_JC/JMIN/JMAX/S1..S4/H1..H4/I1..I5` ...)                                                                                                                                                             |
| `settings/httpproxy.go` (181), `socks5.go` (113), `shadowsocks.go` (98)                                                                                                                                          | Cấu hình 3 proxy                                                                                                                                                                                                                  |
| `settings/firewall.go` (146), `dns.go` (334), `health.go`, `server.go` (control server), `storage.go`, `publicip.go`, `updater.go`, `portforward.go`, `system.go`, `pmtud.go`, `ipv6.go`, `log.go`, `metrics.go` | Phần còn lại                                                                                                                                                                                                                      |
| `settings/*_retro.go`, `deprecated.go`, `nordvpn_retro.go`, `surfshark_retro.go`                                                                                                                                 | Tương thích ngược – **bỏ qua** khi dựng mới                                                                                                                                                                                       |
| `settings/helpers/`, `settings/validation/`                                                                                                                                                                      | Hàm hỗ trợ/validate danh sách server                                                                                                                                                                                              |
| `sources/files/`, `sources/secrets/`                                                                                                                                                                             | Đọc cấu hình WireGuard/AmneziaWG từ file & Docker secrets (`*_SECRETFILE`)                                                                                                                                                        |

Thư viện đọc cấu hình: `github.com/qdm12/gosettings` (reader nhiều nguồn: secrets → files → env).

### 4.5 Orchestrator – `internal/vpn/`

| File                                                    | Vai trò                                                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `loop.go` (110)                                         | struct `Loop`, `NewLoop(...)` (backoff mặc định 15s)                                                |
| `run.go` (127)                                          | vòng lặp chính, chọn backend theo `settings.Type`                                                   |
| `openvpn.go`, `wireguard.go`, `amneziawg.go`            | `setupOpenVPN/Wireguard/AmneziaWg`                                                                  |
| `tunnelup.go` (271)                                     | `onTunnelUp`, PMTUD, healthcheck, restart khi lỗi                                                   |
| `portforward.go`, `helpers.go`, `ipv6.go`, `cleanup.go` | Phụ trợ                                                                                             |
| `settings.go`, `status.go`                              | `GetSettings/SetSettings`, `GetStatus/ApplyStatus` (dùng bởi control server)                        |
| `state/`                                                | Giữ settings + status an toàn đa luồng                                                              |
| `interfaces.go` (124)                                   | **Đọc file này để biết hợp đồng** giữa vpn và firewall/routing/portforward/dns/publicip/healthcheck |

### 4.6 OpenVPN – `internal/openvpn/`

- `start.go`/`start_linux.go`: chạy binary `openvpn2.5` hoặc `openvpn2.6` với `--config /etc/openvpn/target.ovpn` + `OPENVPN_FLAGS`.
- `run.go`: `Runner.Run` → stream log → tín hiệu ready.
- `stream.go`, `logs.go`: lọc/phân loại log; phát hiện `Initialization Sequence Completed`.
- `config.go`, `auth.go`, `paths.go`: ghi file config/auth/askpass.
- `version.go`, `interfaces.go`, `logger.go`, `openvpn.go` (constructor `Configurator`).
- Tùy chọn: `extract/` (parse `.ovpn` custom), `pkcs8/` (giải mã key).
- Hằng số liên quan: `internal/constants/openvpn/` (`auth.go`, `ciphers.go`, `paths.go`, `versions.go`).

### 4.7 WireGuard / AmneziaWG

- `internal/wireguard/`: `run.go` (279) chọn **kernelspace** (nếu kernel hỗ trợ, qua `netlink.IsWireguardSupported`) hoặc **userspace** (`golang.zx2c4.com/wireguard`), theo `WIREGUARD_IMPLEMENTATION` = `auto|kernelspace|userspace`. `config.go` cấu hình thiết bị qua `wgctrl`. `settings.go` (294) validate. Còn `route.go`, `rule.go`, `address.go`, `offload_*.go` (GSO), `netlinker.go`, `constructor.go`.
- `internal/amneziawg/`: cấu trúc tương tự, dùng `github.com/amnezia-vpn/amneziawg-go/v3`.
- Provider chỉ cung cấp `IP`, `Port`, `PubKey` của server; **private key, address, allowed IPs do người dùng đặt** (không tự sinh từ API provider).

### 4.8 Hạ tầng mạng

- `internal/tun/tun.go`: `Setup()` kiểm tra `/dev/net/tun` (major 10 / minor 200), tạo bằng `mknod` nếu thiếu.
- `internal/netlink/`: lớp trừu tượng netlink (address, route, rule, link, conntrack, IPv6 support level, wireguard support). File `*_linux.go` là bản thật, `*_unspecified.go` là stub không-Linux.
- `internal/routing/`: `default.go` (`DefaultRoutes`), `local.go` (`LocalNetworks`), `enable.go` (`Setup`/`TearDown`), `inbound.go`, `outbound.go`, `rules.go`, `routes.go`, `vpn.go` (`VPNLocalGatewayIP`, `VPNRoutes`), `ip.go`, `conversion.go`.
- `internal/firewall/`:
  - `firewall.go` (`Config`, `NewConfig`), `enable.go` (`enable()`: lưu rule cũ → policy `DROP` IPv4+IPv6 → cho phép `lo` → flush kết nối cũ → cho phép established/related → cho phép traffic tới IP VPN → cho phép LAN/outbound subnets → input ports → redirect ports → chạy `/iptables/post-rules.txt`).
  - `vpn.go` (`SetVPNConnection`: thêm/gỡ rule cho IP server VPN + interface VPN), `ports.go`, `outboundsubnets.go`, `redirect.go`, `flush.go`, `wrappers.go`, `interfaces.go`.
  - `iptables/`: triển khai thực tế (`iptables.go`, `ip6tables.go`, `firewall.go`, `iptablesmix.go`, `atomic.go`, `delete.go`, `list.go`, `parse.go`, `support.go`, `tcp.go`).

### 4.9 Ba proxy server

| Proxy       | Package                 | Cổng mặc định | Cách hoạt động                                                                                                                                                                                                                |
| ----------- | ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP/HTTPS  | `internal/httpproxy/`   | `:8888`       | `http.Server` tự viết. `handler.go` kiểm tra `isAccepted` (`accept.go`) + `isAuthorized` (`auth.go`), `CONNECT` → `https.go`, còn lại → `http.go`. Tùy chọn `stealth`, `log`, user/password. Loop dùng `loopstate` + `state/` |
| SOCKS5      | `internal/socks5/`      | `:1080`       | Tự cài đặt SOCKS5 (TCP + UDP): `server.go` (listen, `net.Dialer` đi ra), `socks5.go` (538), `udp_router.go` (378), `usernamepassword.go`, `allowed_ips.go`, `response.go`, `constants.go`, `loop.go`                          |
| Shadowsocks | `internal/shadowsocks/` | `:8388`       | Mỏng: `loop.go` + `state.go`, thực thi bằng thư viện ngoài `github.com/qdm12/ss-server/pkg/tcpudp` (`NewServer` + `Listen`)                                                                                                   |

Cấu hình proxy đều bật/tắt độc lập; mỗi loop có `Run`, `Start/Stop`, backoff 10s khi crash.

---

## 5. Danh sách provider và khả năng (đối chiếu `provider/providers.go` + `settings/provider.go`)

Tên hằng số trong `internal/constants/providers/providers.go`:
`airvpn, custom, cyberghost, example, expressvpn, fastestvpn, giganews, hidemyass, ipvanish, ivpn, mullvad, nordvpn, privado, "private internet access", privatevpn, protonvpn, purevpn, slickvpn, surfshark, torguard, vpnsecure, "vpn unlimited", vyprvpn, windscribe`.
(`example` là template, không nằm trong `All()`; `custom` không nằm trong `All()` nhưng nằm trong `AllWithCustom()`.)

| Loại VPN                              | Provider hợp lệ                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| OpenVPN                               | tất cả trong `AllWithCustom()` + alias `pia`, **trừ `mullvad`** (đã bỏ OpenVPN 15/01/2026) |
| WireGuard                             | `airvpn, custom, fastestvpn, ivpn, mullvad, nordvpn, protonvpn, surfshark, windscribe`     |
| AmneziaWG                             | chỉ `custom`                                                                               |
| Port forwarding (có `portforward.go`) | `private internet access`, `privatevpn`, `protonvpn`                                       |

Provider có `updater/` cần credential: `protonvpn` (email, password, TOTP) – truyền qua `settings.Updater`.

---

## 6. Hướng dẫn thêm 1 provider mới (checklist đã đối chiếu code)

1. Thêm hằng số tên vào `internal/constants/providers/providers.go` và đưa vào `All()`.
2. Sao chép `internal/provider/example/` → `internal/provider/<tên>/`; sửa `Name()`, ports mặc định trong `connection.go`, `OpenVPNProviderSettings` (CA, cipher, TLS auth/crypt...) trong `openvpnconf.go`.
3. Viết `updater/` trả `[]models.Server` (đầy đủ `IPs`, `Hostname`, `TCP/UDP` hoặc `WgPubKey`, `Country/Region/City`...). Chạy `Server.HasMinimumInformation()` để kiểm tra.
4. Đăng ký trong `provider.NewProviders` (`internal/provider/providers.go`).
5. Nếu hỗ trợ WireGuard, thêm vào danh sách trong `settings/provider.go` (nhánh `vpn.Wireguard`).
6. Dữ liệu server: thêm file `<provider>.json` vào kho dữ liệu (module `gluetun-servers`, hoặc đặt vào thư mục `STORAGE_SERVERS_DIRECTORY_PATH`) – `storage` yêu cầu **mọi** provider trong `providers.All()` đều có file embedded (nếu thiếu sẽ `panic` ở `parseHardcodedServers`).
7. Nếu cần port forwarding: thêm `portforward.go` theo `provider/utils/portforward.go` và nối trong `vpn/portforward.go`.

---

## 7. Biến môi trường cốt lõi (trích từ `settings/*.go`)

**Chọn provider/VPN**: `VPN_SERVICE_PROVIDER` (cũ: `VPNSP`), `VPN_TYPE` (`openvpn|wireguard|amneziawg`), `VPN_INTERFACE`, `VPN_UP_COMMAND`, `VPN_DOWN_COMMAND`, `OPENVPN_CUSTOM_CONFIG`.

**Chọn server**: `SERVER_COUNTRIES`, `SERVER_REGIONS`, `SERVER_CITIES`, `SERVER_HOSTNAMES`, `SERVER_NAMES`, `SERVER_NUMBER`, `SERVER_CATEGORIES`, `SERVER_SELECTION_MODE` (`random|ordered`), `FREE_ONLY`, `PREMIUM_ONLY`, `OWNED_ONLY`, `STREAM_ONLY`, `SECURE_CORE_ONLY`, `TOR_ONLY`, `MULTIHOP_ONLY`, `PORT_FORWARD_ONLY`, `VPN_ENDPOINT_IP`, `VPN_ENDPOINT_PORT`.

**OpenVPN**: `OPENVPN_USER`, `OPENVPN_PASSWORD`, `OPENVPN_PROTOCOL`, `OPENVPN_VERSION` (`2.5|2.6`), `OPENVPN_CIPHERS`, `OPENVPN_AUTH`, `OPENVPN_MSSFIX`, `OPENVPN_FLAGS`, `OPENVPN_KEY`, `OPENVPN_CERT`, `OPENVPN_ENCRYPTED_KEY`, `OPENVPN_KEY_PASSPHRASE`, `OPENVPN_PROCESS_USER`, `OPENVPN_VERBOSITY`.

**WireGuard** (tiền tố `WIREGUARD_` hoặc `AMNEZIAWG_`): `_PRIVATE_KEY`, `_PRESHARED_KEY`, `_ADDRESSES`, `_ALLOWED_IPS`, `_PERSISTENT_KEEPALIVE_INTERVAL`, `_MTU`, `WIREGUARD_IMPLEMENTATION`, `WIREGUARD_GSO`.

**Proxy**:

- HTTP: `HTTPPROXY` (bật), `HTTPPROXY_LISTENING_ADDRESS` (mặc định `:8888`), `HTTPPROXY_USER`, `HTTPPROXY_PASSWORD`, `HTTPPROXY_STEALTH`, `HTTPPROXY_LOG` (có alias cũ `PROXY*`, `TINYPROXY*`).
- SOCKS5: `SOCKS5_ENABLED`, `SOCKS5_LISTENING_ADDRESS` (mặc định `:1080`), `SOCKS5_USER`, `SOCKS5_PASSWORD`, `SOCKS5_ALLOWED_CIDRS`.
- Shadowsocks: `SHADOWSOCKS`, `SHADOWSOCKS_LISTENING_ADDRESS` (`:8388`), `SHADOWSOCKS_PASSWORD`, `SHADOWSOCKS_CIPHER`, `SHADOWSOCKS_LOG`.

**Firewall/mạng**: `FIREWALL_ENABLED_DISABLING_IT_SHOOTS_YOU_IN_YOUR_FOOT`, `FIREWALL_INPUT_PORTS`, `FIREWALL_VPN_INPUT_PORTS`, `FIREWALL_OUTBOUND_SUBNETS`.

**DNS**: `DNS_ADDRESS`, `DNS_UPSTREAM_RESOLVER_TYPE`, `DNS_UPSTREAM_RESOLVERS`, `DNS_UPDATE_PERIOD`, `DNS_CACHING`...

**Lưu trữ server**: `STORAGE_SERVERS_ENABLED`, `STORAGE_SERVERS_DIRECTORY_PATH`, `STORAGE_FILEPATH` (legacy).

**Khác**: control server mặc định `:8000`, healthcheck server `127.0.0.1:9999`, pprof `:6060`, `PUID/PGID`, mọi biến đều hỗ trợ hậu tố `_SECRETFILE` (Docker secrets).

---

## 8. Phụ thuộc ngoài quan trọng (từ `go.mod`)

| Module                                                                                | Dùng cho                                                                               |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `github.com/qdm12/gluetun-servers`                                                    | **Dữ liệu server embedded của mọi provider (`<provider>.json`) – không có trong repo** |
| `github.com/qdm12/gosettings`                                                         | Đọc/validate/default settings, secrets                                                 |
| `github.com/qdm12/goshutdown`, `goservices`                                           | Shutdown theo thứ tự, service lifecycle                                                |
| `github.com/qdm12/ss-server`                                                          | Shadowsocks server                                                                     |
| `github.com/qdm12/dns/v2`                                                             | DNS-over-TLS/HTTPS resolver + filter (package `dns`, và DoH dialer cho updater)        |
| `github.com/qdm12/log`, `gotree`, `gosplash`                                          | Log, in cây settings, splash                                                           |
| `golang.zx2c4.com/wireguard`, `wgctrl`                                                | WireGuard userspace + cấu hình thiết bị                                                |
| `github.com/amnezia-vpn/amneziawg-go/v3`                                              | AmneziaWG                                                                              |
| `github.com/jsimonetti/rtnetlink`, `mdlayher/netlink`, `genetlink`, `ti-mo/netfilter` | netlink, conntrack                                                                     |
| `github.com/ProtonMail/go-srp`, `pquerna/otp`                                         | Đăng nhập API ProtonVPN (SRP + TOTP) cho updater/port forward                          |
| `github.com/youmark/pkcs8`                                                            | Giải mã private key PKCS8                                                              |
| `github.com/miekg/dns`, `golang.org/x/net`, `x/sys`, `x/text`                         | DNS, mạng, syscall                                                                     |
| `github.com/prometheus/client_golang`                                                 | Metrics                                                                                |
| `go.uber.org/mock`, `stretchr/testify`                                                | Chỉ cho test                                                                           |

---

## 9. Yêu cầu runtime (từ `Dockerfile`)

- Binary ngoài: **`openvpn2.5` và `openvpn2.6`** (đặt tên bằng cách `mv` binary), `iptables` + `iptables-legacy`, `ca-certificates`, `tzdata`. Chạy trên Alpine.
- Quyền: `NET_ADMIN`, thiết bị `/dev/net/tun`, có thể cần sysctl IPv6.
- Thư mục: `/gluetun` (dữ liệu, `servers/`), `/tmp/gluetun`, `/etc/openvpn/target.ovpn` (config sinh ra), `/iptables/post-rules.txt` (rule iptables tùy chỉnh).
- Cổng EXPOSE: `8000/tcp` (control), `8888/tcp` (HTTP proxy), `8388/tcp+udp` (Shadowsocks), `1080/tcp+udp` (SOCKS5).
- `HEALTHCHECK` chạy `/gluetun-entrypoint healthcheck` (CLI của chính binary).
- Build: `go build -trimpath -ldflags="-s -w -X main.version=... -X main.created=... -X main.commit=..." -o entrypoint cmd/gluetun/main.go`; binary được copy thành `/gluetun-entrypoint`.

---

## 10. Gợi ý thiết kế server riêng (đề xuất của người viết tài liệu, không phải chức năng có sẵn)

**Cách A – Fork giữ nguyên kiến trúc, cắt bớt** (ít rủi ro nhất): giữ Tier 1 đầy đủ; có thể lược `amneziawg`, `pmtud`, `natpmp`, `metrics`, `pprof`, `boringpoll`, `*_retro.go`, `deprecated.go`; chỉ giữ những provider cần dùng (nhớ phải sửa `providers.go`, `constants/providers`, `settings/provider.go`, `storage/hardcoded.go` đồng bộ vì có kiểm tra "đủ provider" bằng panic).

**Cách B – Viết lại tối giản** theo 5 khối, dùng các file Tier 1 làm tham chiếu hành vi:

1. _Provider/server catalog_: struct `Server` + hàm lọc (`models/server.go`, `storage/filter.go`, `provider/utils/connection.go`, `pick.go`).
2. _Config generator_: sinh `.ovpn` (`provider/utils/openvpn.go`) hoặc cấu hình WireGuard (`vpn/wireguard.go` + `wireguard/config.go`).
3. _Tunnel runner_: chạy `openvpn` subprocess (`openvpn/start.go`, `stream.go`) hoặc WireGuard (`wireguard/run.go`).
4. _Network lockdown_: `tun.Setup` + routing + iptables kill-switch (`firewall/enable.go`, `firewall/vpn.go`, `routing/*`).
5. _Proxy front-end_: HTTP CONNECT (`httpproxy/`), SOCKS5 (`socks5/`), Shadowsocks (thư viện `ss-server`).
   Cộng thêm _supervisor loop_ theo `vpn/run.go` + `loopstate` + `healthcheck` để tự restart/đổi server.

Thứ tự khuyến nghị để triển khai từng bước (mỗi bước chạy được): (1) tunnel + provider `custom` → (2) firewall kill-switch + routing → (3) HTTP/SOCKS5 proxy → (4) catalog server + 1 provider thật → (5) healthcheck + auto-restart → (6) DNS nội bộ → (7) control API → (8) updater.

---

## 11. Danh sách BỎ QUA (không cần quét)

- Mọi `*_test.go`, `mocks_generate_test.go`, `mocks_test.go`, `mocks_local_test.go`, `helpers_test.go`, thư mục `testdata/` (vd. `internal/openvpn/pkcs8/testdata/*.pem`).
- `ci/` (module Go riêng cho CI), `devrun/` (công cụ chạy dev cục bộ + mã hóa credential), `.github/`, `.devcontainer/`, `.vscode/`, `.golangci.yml`, `.markdownlint-cli2.jsonc`, `.dockerignore`, `.gitignore`.
- `doc/`, `title.svg`, `README.md`, `maintenance.md`, `LICENSE`, `AGENTS.md` (quy ước coding cho contributor).
- `metrics/` (dashboard Grafana JSON) và `internal/metrics/` nếu không cần Prometheus.
- `internal/configuration/settings/*_retro.go`, `deprecated.go`.
- `internal/provider/*/updater/` của các provider bạn không dùng; `internal/updater/html`, `unzip`, `resolver` nếu không viết updater.
- `internal/pprof/`, `internal/boringpoll/`, `internal/version/`, `internal/format/`, `internal/cleanup/`.

---

## 12. Ghi chú về độ chính xác

- Repo có sẵn file `PROJECT_STRUCTURE.md` (do bên thứ ba/AI khác tạo, ngày sửa 2026-10-02). File đó **có vài chỗ sai** khi đối chiếu code, ví dụ: `internal/mod/` là _kernel module probe_ (không phải "module initialization hooks"); `internal/boringpoll/` là HTTP poller (không phải BoringSSL); `internal/cli/` không phải bộ parser flag tổng quát mà là các subcommand; `internal/server/` là control API (REST) chứ không phải server proxy. **Ưu tiên tài liệu này** thay vì file đó.
- Control server (`internal/server/handler.go`): URI bắt đầu bằng `/v1/` → `handlerv1.go` với các nhánh `/version`, `/vpn`, `/openvpn`, `/dns`, `/updater`, `/publicip`, `/portforward`; các URI khác → `handlerv0.go` (API cũ, giữ tương thích).
- Những mục ở §10 là đề xuất thiết kế, các mục còn lại được đối chiếu trực tiếp với mã nguồn.
