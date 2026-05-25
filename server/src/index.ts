import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

interface Bike {
  id: string;
  name: string;
  price: string;
  type: string;
  specs: string[];
  image: string;
  featured: boolean;
}

const BIKES: Bike[] = [
  {
    id: 'cb300r',
    name: 'Honda CB300R',
    price: '120.000',
    type: 'Sport Cafe',
    specs: ['Chế Độ Lái Thể Thao', 'Phanh ABS', 'Cốp Phụ Nhỏ', 'Tiết Kiệm Xăng'],
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800',
    featured: true,
  },
  {
    id: 'xsr155',
    name: 'Yamaha XSR155',
    price: '150.000',
    type: 'Classic',
    specs: ['Kiểu Dáng Cổ Điển', 'Động Cơ VVA', 'Phuộc USD', 'Côn Tay'],
    image: 'https://images.unsplash.com/photo-1599819811279-d5064cb116d8?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'vespa',
    name: 'Vespa GTS Super Sport',
    price: '150.000',
    type: 'Scooter',
    specs: ['Sang Trọng', 'Phanh ABS / ASR', 'Hộc Để Đồ Trực Diện', 'Smartkey'],
    image: 'https://images.unsplash.com/photo-1623910398863-71ab529fb3df?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'ninja400',
    name: 'Kawasaki Ninja 400',
    price: '250.000',
    type: 'Sport',
    specs: ['Động Cơ 2 Xi-lanh', 'Ly Hợp Chống Trượt', 'Tư Thế Lái Thể Thao', 'Hệ Thống Đèn LED'],
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800',
    featured: true,
  },
  {
    id: 'vision',
    name: 'Honda Vision 110cc',
    price: '80.000',
    type: 'Scooter',
    specs: ['Khóa Smartkey', 'Động Cơ eSP', 'Cốp Xe Rộng', 'Siêu Tiết Kiệm Xăng'],
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800',
    featured: false,
  },
  {
    id: 'exciter155',
    name: 'Yamaha Exciter 155 VVA',
    price: '100.000',
    type: 'Underbone',
    specs: ['Động cơ VVA 155cc', 'Côn Tay Thể Thao', 'Khóa Thông Minh', 'Phanh Đĩa Thủy Lực'],
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
    featured: true,
  }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/bikes', (req, res) => {
  res.json(BIKES);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

