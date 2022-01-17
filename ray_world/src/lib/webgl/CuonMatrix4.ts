import CuonVector3 from "./CuonVector3";
import CuonVector4 from "./CuonVector4";

/**
 * 矩阵
 */
class CuonMatrix4 {
    /**
     * 矩阵核心数据
     */
    public elements: Float32Array;

    public constructor () {
        this.elements = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
    }

    /**
     * 设置为单位矩阵
     * @returns 
     */
    public setIdentity () {
        var e = this.elements;
        e[0] = 1;   e[4] = 0;   e[8]  = 0;   e[12] = 0;
        e[1] = 0;   e[5] = 1;   e[9]  = 0;   e[13] = 0;
        e[2] = 0;   e[6] = 0;   e[10] = 1;   e[14] = 0;
        e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1;
        return this;
    };

    /**
     * 拷贝
     * @param src 
     * @returns 
     */
    public set (src: CuonMatrix4) {
        var i, s, d;
      
        s = src.elements;
        d = this.elements;
      
        if (s === d) {
          return;
        }
          
        for (i = 0; i < 16; ++i) {
          d[i] = s[i];
        }
      
        return this;
    };

    /**
     * 右乘
     * @param other 
     * @returns 
     */
    public concat (other: CuonMatrix4) {
        var i, e, a, b, ai0, ai1, ai2, ai3;
        
        // Calculate e = a * b
        e = this.elements;
        a = this.elements;
        b = other.elements;
        
        // If e equals b, copy b to temporary matrix.
        if (e === b) {
          b = new Float32Array(16);
          for (i = 0; i < 16; ++i) {
            b[i] = e[i];
          }
        }
        
        for (i = 0; i < 4; i++) {
          ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];
          e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
          e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
          e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
          e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
        }
        
        return this;
    };

    /**
     * 右乘
     * @param other 
     * @returns 
     */
    public multiply (other: CuonMatrix4) {
      return this.concat(other);
    }

    /**
     * 右乘 3 维向量
     * @param pos 
     * @returns 
     */
    public multiplyVector3 (pos: CuonVector3, v: CuonVector3) {
        var e = this.elements;
        var p = pos.elements;
        var result = v.elements;
      
        result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + e[12];
        result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + e[13];
        result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[14];
      
        return v;
    };

    /**
     * 右乘 4 维向量
     * @param pos 
     * @returns 
     */
    public multiplyVector4 (pos: CuonVector4, v = new CuonVector4()) {
      var e = this.elements;
      var p = pos.elements;
      var result = v.elements;
    
      result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + p[3] * e[12];
      result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + p[3] * e[13];
      result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14];
      result[3] = p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15];
    
      return v;
    };

    /**
     * 转置
     * @returns 
     */
    public transpose () {
      var e, t;
    
      e = this.elements;
    
      t = e[ 1];  e[ 1] = e[ 4];  e[ 4] = t;
      t = e[ 2];  e[ 2] = e[ 8];  e[ 8] = t;
      t = e[ 3];  e[ 3] = e[12];  e[12] = t;
      t = e[ 6];  e[ 6] = e[ 9];  e[ 9] = t;
      t = e[ 7];  e[ 7] = e[13];  e[13] = t;
      t = e[11];  e[11] = e[14];  e[14] = t;
    
      return this;
    };

    /**
     * 求逆矩阵
     * @param other 
     * @returns 
     */
    public setInverseOf (other: CuonMatrix4) {
      var i, s, d, inv, det;
    
      s = other.elements;
      d = this.elements;
      inv = new Float32Array(16);
    
      inv[0]  =   s[5]*s[10]*s[15] - s[5] *s[11]*s[14] - s[9] *s[6]*s[15]
                + s[9]*s[7] *s[14] + s[13]*s[6] *s[11] - s[13]*s[7]*s[10];
      inv[4]  = - s[4]*s[10]*s[15] + s[4] *s[11]*s[14] + s[8] *s[6]*s[15]
                - s[8]*s[7] *s[14] - s[12]*s[6] *s[11] + s[12]*s[7]*s[10];
      inv[8]  =   s[4]*s[9] *s[15] - s[4] *s[11]*s[13] - s[8] *s[5]*s[15]
                + s[8]*s[7] *s[13] + s[12]*s[5] *s[11] - s[12]*s[7]*s[9];
      inv[12] = - s[4]*s[9] *s[14] + s[4] *s[10]*s[13] + s[8] *s[5]*s[14]
                - s[8]*s[6] *s[13] - s[12]*s[5] *s[10] + s[12]*s[6]*s[9];
    
      inv[1]  = - s[1]*s[10]*s[15] + s[1] *s[11]*s[14] + s[9] *s[2]*s[15]
                - s[9]*s[3] *s[14] - s[13]*s[2] *s[11] + s[13]*s[3]*s[10];
      inv[5]  =   s[0]*s[10]*s[15] - s[0] *s[11]*s[14] - s[8] *s[2]*s[15]
                + s[8]*s[3] *s[14] + s[12]*s[2] *s[11] - s[12]*s[3]*s[10];
      inv[9]  = - s[0]*s[9] *s[15] + s[0] *s[11]*s[13] + s[8] *s[1]*s[15]
                - s[8]*s[3] *s[13] - s[12]*s[1] *s[11] + s[12]*s[3]*s[9];
      inv[13] =   s[0]*s[9] *s[14] - s[0] *s[10]*s[13] - s[8] *s[1]*s[14]
                + s[8]*s[2] *s[13] + s[12]*s[1] *s[10] - s[12]*s[2]*s[9];
    
      inv[2]  =   s[1]*s[6]*s[15] - s[1] *s[7]*s[14] - s[5] *s[2]*s[15]
                + s[5]*s[3]*s[14] + s[13]*s[2]*s[7]  - s[13]*s[3]*s[6];
      inv[6]  = - s[0]*s[6]*s[15] + s[0] *s[7]*s[14] + s[4] *s[2]*s[15]
                - s[4]*s[3]*s[14] - s[12]*s[2]*s[7]  + s[12]*s[3]*s[6];
      inv[10] =   s[0]*s[5]*s[15] - s[0] *s[7]*s[13] - s[4] *s[1]*s[15]
                + s[4]*s[3]*s[13] + s[12]*s[1]*s[7]  - s[12]*s[3]*s[5];
      inv[14] = - s[0]*s[5]*s[14] + s[0] *s[6]*s[13] + s[4] *s[1]*s[14]
                - s[4]*s[2]*s[13] - s[12]*s[1]*s[6]  + s[12]*s[2]*s[5];
    
      inv[3]  = - s[1]*s[6]*s[11] + s[1]*s[7]*s[10] + s[5]*s[2]*s[11]
                - s[5]*s[3]*s[10] - s[9]*s[2]*s[7]  + s[9]*s[3]*s[6];
      inv[7]  =   s[0]*s[6]*s[11] - s[0]*s[7]*s[10] - s[4]*s[2]*s[11]
                + s[4]*s[3]*s[10] + s[8]*s[2]*s[7]  - s[8]*s[3]*s[6];
      inv[11] = - s[0]*s[5]*s[11] + s[0]*s[7]*s[9]  + s[4]*s[1]*s[11]
                - s[4]*s[3]*s[9]  - s[8]*s[1]*s[7]  + s[8]*s[3]*s[5];
      inv[15] =   s[0]*s[5]*s[10] - s[0]*s[6]*s[9]  - s[4]*s[1]*s[10]
                + s[4]*s[2]*s[9]  + s[8]*s[1]*s[6]  - s[8]*s[2]*s[5];
    
      det = s[0]*inv[0] + s[1]*inv[4] + s[2]*inv[8] + s[3]*inv[12];
      if (det === 0) {
        return this;
      }
    
      det = 1 / det;
      for (i = 0; i < 16; i++) {
        d[i] = inv[i] * det;
      }
    
      return this;
    };

    /**
     * 设置为自身的逆矩阵
     * @returns 
     */
    public invert () {
      return this.setInverseOf(this);
    };

    /**
     * 设置为正交视图矩阵
     * @param left 
     * @param right 
     * @param bottom 
     * @param top 
     * @param near 
     * @param far 
     * @returns 
     */
    public setOrtho (left: number, right: number, bottom: number, top: number, near: number, far: number): CuonMatrix4 {
      var e, rw, rh, rd;
    
      if (left === right || bottom === top || near === far) {
        console.error('null frustum');
        return null as any;
      }
    
      rw = 1 / (right - left);
      rh = 1 / (top - bottom);
      rd = 1 / (far - near);
    
      e = this.elements;
    
      e[0]  = 2 * rw;
      e[1]  = 0;
      e[2]  = 0;
      e[3]  = 0;
    
      e[4]  = 0;
      e[5]  = 2 * rh;
      e[6]  = 0;
      e[7]  = 0;
    
      e[8]  = 0;
      e[9]  = 0;
      e[10] = -2 * rd;
      e[11] = 0;
    
      e[12] = -(right + left) * rw;
      e[13] = -(top + bottom) * rh;
      e[14] = -(far + near) * rd;
      e[15] = 1;
    
      return this;
    };
    
    /**
     * 左乘正交视图矩阵
     * @param left 
     * @param right 
     * @param bottom 
     * @param top 
     * @param near 
     * @param far 
     * @returns 
     */
    public ortho (left: number, right: number, bottom: number, top: number, near: number, far: number) {
      return this.concat(new CuonMatrix4().setOrtho(left, right, bottom, top, near, far));
    };

    /**
     * 设置为透视视图矩阵
     * @param left 
     * @param right 
     * @param bottom 
     * @param top 
     * @param near 
     * @param far 
     * @returns 
     */
    public setFrustum (left: number, right: number, bottom: number, top: number, near: number, far: number): CuonMatrix4 {
      var e, rw, rh, rd;
    
      if (left === right || top === bottom || near === far) {
        console.error('null frustum');
        return null as any;
      }
      if (near <= 0) {
        console.error('near <= 0');
        return null as any;
      }
      if (far <= 0) {
        console.error('far <= 0');
        return null as any;
      }
    
      rw = 1 / (right - left);
      rh = 1 / (top - bottom);
      rd = 1 / (far - near);
    
      e = this.elements;
    
      e[ 0] = 2 * near * rw;
      e[ 1] = 0;
      e[ 2] = 0;
      e[ 3] = 0;
    
      e[ 4] = 0;
      e[ 5] = 2 * near * rh;
      e[ 6] = 0;
      e[ 7] = 0;
    
      e[ 8] = (right + left) * rw;
      e[ 9] = (top + bottom) * rh;
      e[10] = -(far + near) * rd;
      e[11] = -1;
    
      e[12] = 0;
      e[13] = 0;
      e[14] = -2 * near * far * rd;
      e[15] = 0;
    
      return this;
    };

    /**
     * 左乘透视视图矩阵
     * @param left 
     * @param right 
     * @param bottom 
     * @param top 
     * @param near 
     * @param far 
     * @returns 
     */
    public frustum (left: number, right: number, bottom: number, top: number, near: number, far: number) {
      return this.concat(new CuonMatrix4().setFrustum(left, right, bottom, top, near, far));
    };

    /**
     * 设置为透视投影矩阵
     * @param fovy 
     * @param aspect 
     * @param near 
     * @param far 
     * @returns 
     */
    public setPerspective (fovy: number, aspect: number, near: number, far: number): CuonMatrix4 {
      var e, rd, s, ct;
    
      if (near === far || aspect === 0) {
        console.error('null frustum');
        return null as any;
      }
      if (near <= 0) {
        console.error('near <= 0');
        return null as any;
      }
      if (far <= 0) {
        console.error('far <= 0');
        return null as any;
      }
    
      fovy = Math.PI * fovy / 180 / 2;
      s = Math.sin(fovy);
      if (s === 0) {
        console.error('null frustum');
        return null as any;
      }
    
      rd = 1 / (far - near);
      ct = Math.cos(fovy) / s;
    
      e = this.elements;
    
      e[0]  = ct / aspect;
      e[1]  = 0;
      e[2]  = 0;
      e[3]  = 0;
    
      e[4]  = 0;
      e[5]  = ct;
      e[6]  = 0;
      e[7]  = 0;
    
      e[8]  = 0;
      e[9]  = 0;
      e[10] = -(far + near) * rd;
      e[11] = -1;
    
      e[12] = 0;
      e[13] = 0;
      e[14] = -2 * near * far * rd;
      e[15] = 0;
    
      return this;
    };

    /**
     * 左乘透视投影矩阵
     * @param fovy 
     * @param aspect 
     * @param near 
     * @param far 
     * @returns 
     */
    public perspective (fovy: number, aspect: number, near: number, far: number) {
      return this.concat(new CuonMatrix4().setPerspective(fovy, aspect, near, far));
    };

    /**
     * 设置为缩放矩阵
     * @param x 
     * @param y 
     * @param z 
     * @returns 
     */
    public setScale (x: number, y: number, z: number) {
      var e = this.elements;
      e[0] = x;  e[4] = 0;  e[8]  = 0;  e[12] = 0;
      e[1] = 0;  e[5] = y;  e[9]  = 0;  e[13] = 0;
      e[2] = 0;  e[6] = 0;  e[10] = z;  e[14] = 0;
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
      return this;
    };

    /**
     * 左乘缩放矩阵
     * @param x 
     * @param y 
     * @param z 
     * @returns 
     */
    public scale (x: number, y: number, z: number) {
      var e = this.elements;
      e[0] *= x;  e[4] *= y;  e[8]  *= z;
      e[1] *= x;  e[5] *= y;  e[9]  *= z;
      e[2] *= x;  e[6] *= y;  e[10] *= z;
      e[3] *= x;  e[7] *= y;  e[11] *= z;
      return this;
    };

    /**
     * 设置为平移变换矩阵
     * @param x 
     * @param y 
     * @param z 
     * @returns 
     */
    public setTranslate (x: number, y: number, z: number) {
      var e = this.elements;
      e[0] = 1;  e[4] = 0;  e[8]  = 0;  e[12] = x;
      e[1] = 0;  e[5] = 1;  e[9]  = 0;  e[13] = y;
      e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = z;
      e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
      return this;
    };

    /**
     * 左乘平移变换矩阵
     * @param x 
     * @param y 
     * @param z 
     * @returns 
     */
    public translate (x: number, y: number, z: number) {
      var e = this.elements;
      e[12] += e[0] * x + e[4] * y + e[8]  * z;
      e[13] += e[1] * x + e[5] * y + e[9]  * z;
      e[14] += e[2] * x + e[6] * y + e[10] * z;
      e[15] += e[3] * x + e[7] * y + e[11] * z;
      return this;
    };

    /**
     * 设置为旋转变换矩阵
     * @param angle 
     * @param x 
     * @param y 
     * @param z 
     * @returns 
     */
    public setRotate (angle: number, x: number, y: number, z: number) {
      var e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;
    
      angle = Math.PI * angle / 180;
      e = this.elements;
    
      s = Math.sin(angle);
      c = Math.cos(angle);
    
      if (0 !== x && 0 === y && 0 === z) {
        // Rotation around X axis
        if (x < 0) {
          s = -s;
        }
        e[0] = 1;  e[4] = 0;  e[ 8] = 0;  e[12] = 0;
        e[1] = 0;  e[5] = c;  e[ 9] =-s;  e[13] = 0;
        e[2] = 0;  e[6] = s;  e[10] = c;  e[14] = 0;
        e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
      } else if (0 === x && 0 !== y && 0 === z) {
        // Rotation around Y axis
        if (y < 0) {
          s = -s;
        }
        e[0] = c;  e[4] = 0;  e[ 8] = s;  e[12] = 0;
        e[1] = 0;  e[5] = 1;  e[ 9] = 0;  e[13] = 0;
        e[2] =-s;  e[6] = 0;  e[10] = c;  e[14] = 0;
        e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
      } else if (0 === x && 0 === y && 0 !== z) {
        // Rotation around Z axis
        if (z < 0) {
          s = -s;
        }
        e[0] = c;  e[4] =-s;  e[ 8] = 0;  e[12] = 0;
        e[1] = s;  e[5] = c;  e[ 9] = 0;  e[13] = 0;
        e[2] = 0;  e[6] = 0;  e[10] = 1;  e[14] = 0;
        e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
      } else {
        // Rotation around another axis
        len = Math.sqrt(x*x + y*y + z*z);
        if (len !== 1) {
          rlen = 1 / len;
          x *= rlen;
          y *= rlen;
          z *= rlen;
        }
        nc = 1 - c;
        xy = x * y;
        yz = y * z;
        zx = z * x;
        xs = x * s;
        ys = y * s;
        zs = z * s;
    
        e[ 0] = x*x*nc +  c;
        e[ 1] = xy *nc + zs;
        e[ 2] = zx *nc - ys;
        e[ 3] = 0;
    
        e[ 4] = xy *nc - zs;
        e[ 5] = y*y*nc +  c;
        e[ 6] = yz *nc + xs;
        e[ 7] = 0;
    
        e[ 8] = zx *nc + ys;
        e[ 9] = yz *nc - xs;
        e[10] = z*z*nc +  c;
        e[11] = 0;
    
        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;
      }
    
      return this;
    };

    /**
     * 左乘旋转变换矩阵
     * @param angle 
     * @param x 
     * @param y 
     * @param z 
     * @returns 
     */
    rotate (angle: number, x: number, y: number, z: number) {
      return this.concat(new CuonMatrix4().setRotate(angle, x, y, z));
    };

    /**
     * 设置为观察变换矩阵
     * @param eyeX 
     * @param eyeY 
     * @param eyeZ 
     * @param centerX 
     * @param centerY 
     * @param centerZ 
     * @param upX 
     * @param upY 
     * @param upZ 
     * @returns 
     */
    setLookAt (eyeX: number, eyeY: number, eyeZ: number, centerX: number, centerY: number, centerZ: number, upX: number, upY: number, upZ: number) {
      var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;
    
      fx = centerX - eyeX;
      fy = centerY - eyeY;
      fz = centerZ - eyeZ;
    
      // Normalize f.
      rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
      fx *= rlf;
      fy *= rlf;
      fz *= rlf;
    
      // Calculate cross product of f and up.
      sx = fy * upZ - fz * upY;
      sy = fz * upX - fx * upZ;
      sz = fx * upY - fy * upX;
    
      // Normalize s.
      rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
      sx *= rls;
      sy *= rls;
      sz *= rls;
    
      // Calculate cross product of s and f.
      ux = sy * fz - sz * fy;
      uy = sz * fx - sx * fz;
      uz = sx * fy - sy * fx;
    
      // Set to this.
      e = this.elements;
      e[0] = sx;
      e[1] = ux;
      e[2] = -fx;
      e[3] = 0;
    
      e[4] = sy;
      e[5] = uy;
      e[6] = -fy;
      e[7] = 0;
    
      e[8] = sz;
      e[9] = uz;
      e[10] = -fz;
      e[11] = 0;
    
      e[12] = 0;
      e[13] = 0;
      e[14] = 0;
      e[15] = 1;
    
      // Translate.
      return this.translate(-eyeX, -eyeY, -eyeZ);
    };

    /**
     * 左乘观察变换矩阵
     * @param eyeX 
     * @param eyeY 
     * @param eyeZ 
     * @param centerX 
     * @param centerY 
     * @param centerZ 
     * @param upX 
     * @param upY 
     * @param upZ 
     * @returns 
     */
    public lookAt (eyeX: number, eyeY: number, eyeZ: number, centerX: number, centerY: number, centerZ: number, upX: number, upY: number, upZ: number) {
      return this.concat(new CuonMatrix4().setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
    };

    /**
     * 投下阴影
     * @param plane 
     * @param light 
     * @returns 
     */
    public dropShadow (plane: number[], light: number[]) {
      var mat = new CuonMatrix4();
      var e = mat.elements;
    
      var dot = plane[0] * light[0] + plane[1] * light[1] + plane[2] * light[2] + plane[3] * light[3];
    
      e[ 0] = dot - light[0] * plane[0];
      e[ 1] =     - light[1] * plane[0];
      e[ 2] =     - light[2] * plane[0];
      e[ 3] =     - light[3] * plane[0];
    
      e[ 4] =     - light[0] * plane[1];
      e[ 5] = dot - light[1] * plane[1];
      e[ 6] =     - light[2] * plane[1];
      e[ 7] =     - light[3] * plane[1];
    
      e[ 8] =     - light[0] * plane[2];
      e[ 9] =     - light[1] * plane[2];
      e[10] = dot - light[2] * plane[2];
      e[11] =     - light[3] * plane[2];
    
      e[12] =     - light[0] * plane[3];
      e[13] =     - light[1] * plane[3];
      e[14] =     - light[2] * plane[3];
      e[15] = dot - light[3] * plane[3];
    
      return this.concat(mat);
    }
    
    /**
     * 投下阴影
     * @param normX 
     * @param normY 
     * @param normZ 
     * @param planeX 
     * @param planeY 
     * @param planeZ 
     * @param lightX 
     * @param lightY 
     * @param lightZ 
     * @returns 
     */
    public dropShadowDirectionally (normX: number, normY: number, normZ: number, planeX: number, planeY: number, planeZ: number, lightX: number, lightY: number, lightZ: number) {
      var a = planeX * normX + planeY * normY + planeZ * normZ;
      return this.dropShadow([normX, normY, normZ, -a], [lightX, lightY, lightZ, 0]);
    };
}

export default CuonMatrix4;