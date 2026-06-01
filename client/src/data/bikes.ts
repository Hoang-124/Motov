export interface Bike {
  id: string;
  name: string;
  price: string;
  type: string;
  specs: string[];
  image: string;
  featured: boolean;
  ownerEmail?: string;
}

export const INITIAL_BIKES: Bike[] = [
  {
    "id": "honda-vision-smartkey",
    "name": "Honda Vision Smartkey",
    "price": "90.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Khóa Smartkey",
      "Động Cơ eSP",
      "Cốp Xe Rộng",
      "Siêu Tiết Kiệm Xăng"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": true,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-air-blade",
    "name": "Honda Air Blade",
    "price": "130.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Phanh ABS An Toàn",
      "Động Cơ eSP+",
      "Cốp Rộng 23.2L",
      "Sạc USB Tiện Lợi"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": true,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-lead",
    "name": "Honda Lead",
    "price": "120.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Cốp Siêu Rộng 37L",
      "Sạc Điện Thoại",
      "Sàn Để Chân Rộng",
      "Động Cơ eSP+"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-sh-mode-sh",
    "name": "Honda SH Mode / SH",
    "price": "240.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Phanh ABS Hai Kênh",
      "Smartkey Thông Minh",
      "Đèn LED Cao Cấp",
      "Thiết Kế Thời Thượng"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "yamaha-grande-hybrid",
    "name": "Yamaha Grande Hybrid",
    "price": "120.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Động Cơ Hybrid",
      "Cốp Rộng 27L",
      "Nắp Bình Xăng Trước",
      "Trọng Lượng Siêu Nhẹ"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "yamaha-janus",
    "name": "Yamaha Janus",
    "price": "90.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Khóa Smartkey",
      "Động Cơ Blue Core",
      "Thiết Kế Nhỏ Gọn",
      "Tiết Kiệm Nhiên Liệu"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "yamaha-nvx",
    "name": "Yamaha NVX",
    "price": "140.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Phanh ABS Bánh Trước",
      "Động Cơ Blue Core 155cc",
      "Van Biến Thiên VVA",
      "Smartkey Thông Minh"
    ],
    "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "vespa-sprint-primavera",
    "name": "Vespa Sprint / Primavera",
    "price": "220.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Phanh ABS An Toàn",
      "Động Cơ i-Get Mới",
      "Vỏ Thép Nguyên Khối",
      "Thiết Kế Ý Sang Trọng"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": true,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "piaggio-liberty-abs",
    "name": "Piaggio Liberty ABS",
    "price": "140.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Phanh ABS An Toàn",
      "Động Cơ i-Get",
      "Bánh Xe Kích Thước Lớn",
      "Khóa Từ Chống Trộm"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "suzuki-burgman-street",
    "name": "Suzuki Burgman Street",
    "price": "130.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Tư Thế Ngồi Thoải Mái",
      "Động Cơ SEP Tiết Kiệm",
      "Cốp Xe Rộng Rãi",
      "Đầu Sạc 12V Tiện Lợi"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "suzuki-impulse",
    "name": "Suzuki Impulse",
    "price": "100.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Thiết Kế Thể Thao",
      "Hệ Thống Phun Xăng FI",
      "Vận Hành Đầm Chắc",
      "Cốp Đồ Tiện Lợi"
    ],
    "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "sym-attila-elizabethvenus",
    "name": "SYM Attila (Elizabeth/Venus)",
    "price": "90.000",
    "type": "Xe Tay Ga",
    "specs": [
      "Kiểu Dáng Cổ Điển",
      "Nắp Bình Xăng Ngoài",
      "Cốp Đồ Rộng Rãi",
      "Động Cơ Êm Ái"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "sym-elite-50",
    "name": "SYM Elite 50",
    "price": "110.000",
    "type": "Xe 50cc",
    "specs": [
      "Không Cần Bằng Lái",
      "Kiểu Dáng Nhỏ Xinh",
      "Nắp Bình Xăng Tiện Lợi",
      "Phù Hợp Học Sinh"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "sym-passing-50",
    "name": "SYM Passing 50",
    "price": "110.000",
    "type": "Xe 50cc",
    "specs": [
      "Không Cần Bằng Lái",
      "Kiểu Dáng Thể Thao",
      "Đèn Halogen Siêu Sáng",
      "Khung Sườn Đầm Chắc"
    ],
    "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "sym-attila-50",
    "name": "SYM Attila 50",
    "price": "120.000",
    "type": "Xe 50cc",
    "specs": [
      "Không Cần Bằng Lái",
      "Dáng Vespa Thanh Lịch",
      "Cốp Xe Rộng Rãi",
      "Tiết Kiệm Nhiên Liệu"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "sym-elegant-50",
    "name": "SYM Elegant 50",
    "price": "90.000",
    "type": "Xe 50cc",
    "specs": [
      "Không Cần Bằng Lái",
      "Động Cơ Siêu Bền",
      "Tiết Kiệm Xăng Cực Kì",
      "Dễ Dàng Vận Hành"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "sym-angela-50",
    "name": "SYM Angela 50",
    "price": "90.000",
    "type": "Xe 50cc",
    "specs": [
      "Không Cần Bằng Lái",
      "Có Hộc Đồ Phía Trước",
      "Yên Xe Dài Êm Ái",
      "Thiết Kế Dễ Thương"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-wave-alpha-rsx",
    "name": "Honda Wave Alpha / RSX",
    "price": "80.000",
    "type": "Xe Số",
    "specs": [
      "Động Cơ 110cc Bền Bỉ",
      "Hệ Thống Phun Xăng FI",
      "Cực Kỳ Tiết Kiệm Xăng",
      "Dễ Bảo Dưỡng Sửa Chữa"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-future",
    "name": "Honda Future",
    "price": "110.000",
    "type": "Xe Số",
    "specs": [
      "Động Cơ 125cc Mạnh Mẽ",
      "Tiết Kiệm Xăng Vượt Trội",
      "Cốp Xe U-Box Rộng",
      "Đèn Pha LED Bền Bỉ"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "yamaha-sirius",
    "name": "Yamaha Sirius",
    "price": "80.000",
    "type": "Xe Số",
    "specs": [
      "Động Cơ 110cc Bốc Khỏe",
      "Khung Sườn Chắc Chắn",
      "Giá Thuê Cực Rẻ",
      "Dễ Dàng Vượt Đèo Dốc"
    ],
    "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "yamaha-jupiter-fi",
    "name": "Yamaha Jupiter FI",
    "price": "100.000",
    "type": "Xe Số",
    "specs": [
      "Động Cơ Phun Xăng FI",
      "Vận Hành Đầm Chắc",
      "Phuộc Bình Dầu Thể Thao",
      "Tiết Kiệm Nhiên Liệu"
    ],
    "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "yamaha-exciter-150155-vva",
    "name": "Yamaha Exciter 150/155 VVA",
    "price": "120.000",
    "type": "Xe Côn Tay",
    "specs": [
      "Động Cơ 155cc VVA",
      "Côn Tay Thể Thao",
      "Khóa Smartkey",
      "Ly Hợp Chống Trượt"
    ],
    "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    "featured": true,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-winner-x",
    "name": "Honda Winner X",
    "price": "110.000",
    "type": "Xe Côn Tay",
    "specs": [
      "Phanh ABS An Toàn",
      "Động Cơ DOHC 150cc",
      "Xích Có Phớt Cao Su",
      "Ống Xả Thể Thao Bốc"
    ],
    "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "suzuki-raider-satria-150",
    "name": "Suzuki Raider / Satria 150",
    "price": "140.000",
    "type": "Xe Côn Tay",
    "specs": [
      "Động Cơ DOHC Mạnh Mẽ",
      "Kiểu Dáng Hyper Underbone",
      "Trọng Lượng Siêu Nhẹ",
      "Khả N Kahn Gia Tốc Cực Nhanh"
    ],
    "image": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "yamaha-xsr-155",
    "name": "Yamaha XSR 155",
    "price": "200.000",
    "type": "Classic",
    "specs": [
      "Kiểu Dáng Cổ Điển",
      "Động Cơ VVA 155cc",
      "Phuộc Ngược USD",
      "Bộ Ly Hợp Chống Trượt"
    ],
    "image": "https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-cb150r-neo",
    "name": "Honda CB150R Neo",
    "price": "200.000",
    "type": "Sport Cafe",
    "specs": [
      "Thiết Kế Neo Sports Cafe",
      "Phuộc USD Showa 41mm",
      "Phanh ABS G-Sensor",
      "Gắp Sau Nhôm Đúc"
    ],
    "image": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "suzuki-bandit-150-gsx-s150",
    "name": "Suzuki Bandit 150 / GSX-S150",
    "price": "150.000",
    "type": "Xe Côn Tay",
    "specs": [
      "Động Cơ DOHC 150cc",
      "Tư Thế Ngồi Thoải Mái",
      "Khung Sườn Đầm Chắc",
      "Thích Hợp Phượt Đường Dài"
    ],
    "image": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "vinfast-evo200",
    "name": "VinFast Evo200",
    "price": "100.000",
    "type": "Xe Máy Điện",
    "specs": [
      "Quãng Đường 203km/Sạc",
      "Pin LFP Tiên Tiến",
      "Chống Nước IP67",
      "Tốc Độ Tối Đa 70km/h"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "vinfast-feliz-s",
    "name": "VinFast Feliz S",
    "price": "120.000",
    "type": "Xe Máy Điện",
    "specs": [
      "Động Cơ Điện 3000W",
      "Quãng Đường 198km",
      "Cốp Rộng Rãi 25L",
      "Hệ Thống Phanh An Toàn"
    ],
    "image": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "vinfast-klara-s",
    "name": "VinFast Klara S",
    "price": "130.000",
    "type": "Xe Máy Điện",
    "specs": [
      "Thiết Kế Ý Thanh Lịch",
      "Động Cơ Bosch Cao Cấp",
      "Hai Viên Pin LFP",
      "Kết Nối Thông Minh App"
    ],
    "image": "https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "dat-bike-weaverplus",
    "name": "Dat Bike Weaver++",
    "price": "170.000",
    "type": "Xe Máy Điện",
    "specs": [
      "Động Cơ 7000W Siêu Bốc",
      "Sạc Nhanh 3 Giờ",
      "Quãng Đường 200km",
      "Thiết Kế Retro Độc Đáo"
    ],
    "image": "https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800",
    "featured": true,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-rebel-300-500",
    "name": "Honda Rebel 300 / 500",
    "price": "450.000",
    "type": "Cruiser",
    "specs": [
      "Động Cơ Cruiser Uy Lực",
      "Tư Thế Ngồi Thấp Phong Trần",
      "Phanh ABS Cả Hai Bánh",
      "Thích Hợp Tour Đường Trường"
    ],
    "image": "https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "honda-cb500x",
    "name": "Honda CB500X",
    "price": "550.000",
    "type": "Adventure",
    "specs": [
      "Dòng Xe Adventure Chuyên Nghiệp",
      "Động Cơ 2 Xi-lanh Mạnh Mẽ",
      "Phuộc Hành Trình Dài",
      "Kính Chắn Gió Lớn"
    ],
    "image": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    "featured": false,
    "ownerEmail": "system@motov.com"
  },
  {
    "id": "kawasaki-ninja-400",
    "name": "Kawasaki Ninja 400",
    "price": "450.000",
    "type": "Sport",
    "specs": [
      "Động Cơ 2 Xi-lanh 399cc",
      "Bộ Ly Hợp Chống Trượt",
      "Tư Thế Lái Thể Thao",
      "Mặt Đồng Hồ LCD Đa Năng"
    ],
    "image": "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
    "featured": true,
    "ownerEmail": "system@motov.com"
  }
];

export const getBikes = (): Bike[] => {
  const stored = localStorage.getItem('motov_bikes');
  if (!stored) {
    localStorage.setItem('motov_bikes', JSON.stringify(INITIAL_BIKES));
    return INITIAL_BIKES;
  }
  try {
    const list = JSON.parse(stored);
    if (list.length !== 34) {
      localStorage.setItem('motov_bikes', JSON.stringify(INITIAL_BIKES));
      return INITIAL_BIKES;
    }
    return list;
  } catch (e) {
    return INITIAL_BIKES;
  }
};

export const saveBikes = (bikes: Bike[]) => {
  localStorage.setItem('motov_bikes', JSON.stringify(bikes));
};
