import type Matrix from "./matrix"

export default class SVD {

  private m: number
  private n: number

  private u: number[][] = []
  private sv: number[] = []
  private v: number[][] = []

  private matrix: Matrix

  public constructor(matrix: Matrix) {
    this.matrix = matrix

    this.m = this.matrix.get().length
    this.n = this.matrix.get()[0].length
  }

  public decompose() {
    const m = this.m
    const n = this.n
    const nu = Math.min(m, n)

    const A = this.matrix.get()

    const s     = this.matrix.construct(Math.min(m+1, n)) as number[]
    const U     = this.matrix.construct(m, nu) as number[][]
    const V     = this.matrix.construct(n, n) as number[][]
    const e     = this.matrix.construct(n) as number[]
    const work  = this.matrix.construct(m) as number[]
    
    const wantu = true
    const wantv = true
    
    const nct = Math.min(m-1, n);
    const nrt = Math.max(0, Math.min(n-2, m));
    for (let k = 0; k < Math.max(nct, nrt); k++) {
      if (k < nct) {
        // Compute the transformation for the k-th column and
        // place the k-th diagonal in s[k].
        // Compute 2-norm of k-th column without under/overflow.
        s[k] = 0
        for (let i = k; i < m; i++) {
          s[k] = Math.hypot(s[k], A[i][k]);
        }
        
        if (s[k] != 0) {
          if (A[k][k] < 0) s[k] = -s[k];

          for (let i = k; i < m; i++) {
            A[i][k] /= s[k];
          }

          A[k][k] += 1;
        }

        s[k] = -s[k];
      }
      
      for (let j = k+1; j < n; j++) {
        if ((k < nct) && (s[k] != 0))  {
          // Apply the transformation.
          let t = 0;
          for (let i = k; i < m; i++) {
            t += A[i][k] * A[i][j];
          }

          t = -t / A[k][k];
          for (let i = k; i < m; i++) {
            A[i][j] += t * A[i][k];
          }
        }

        // Place the k-th row of A into e for the
        // subsequent calculation of the row transformation.
        e[j] = A[k][j];
      }

      //TODO: delete want u later
      if (wantu && (k < nct)) {
        // Place the transformation in U for subsequent back
        // multiplication.
        for (let i = k; i < m; i++) {
          U[i][k] = A[i][k];
        }
      }

      if (k < nrt) {
        // Compute the k-th row transformation and place the
        // k-th super-diagonal in e[k].
        // Compute 2-norm without under/overflow.
        e[k] = 0;
        for (let i = k+1; i < n; i++) {
          e[k] = Math.hypot(e[k], e[i]);
        }

        if (e[k] != 0) {
          if (e[k+1] < 0) {
            e[k] = -e[k];
          }

          for (let i = k+1; i < n; i++) {
            e[i] /= e[k];
          }

          e[k+1] += 1;
        }

        e[k] = -e[k];
        if ((k+1 < m) && (e[k] != 0)) {
          // Apply the transformation.
          for (let i = k+1; i < m; i++) {
            work[i] = 0;
          }

          for (let j = k+1; j < n; j++) {
            for (let i = k+1; i < m; i++) {
              work[i] += e[j] * A[i][j];
            }
          }

          for (let j = k+1; j < n; j++) {
            const t = -e[j] / e[k+1];
            for (let i = k+1; i < m; i++) {
              A[i][j] += t * work[i];
            }
          }
        }

        if (wantv) {
          // Place the transformation in V for subsequent
          // back multiplication.
          for (let i = k+1; i < n; i++) {
            V[i][k] = e[i];
          }
        }
      }
    }

    // Set up the final bidiagonal matrix or order p.
    let p = Math.min(n, m+1);
    if (nct < n) {
      s[nct] = A[nct][nct];
    }

    if (m < p) {
      s[p-1] = 0;
    }

    if (nrt+1 < p) {
      e[nrt] = A[nrt][p-1];
    }

    e[p-1] = 0;

    //TODO: delete wantu
    if (wantu) {
       for (let j = nct; j < nu; j++) {
          for (let i = 0; i < m; i++) {
            U[i][j] = 0;
          }

          U[j][j] = 1;
       }

       for (let k = nct-1; k >= 0; k--) {
          if (s[k] != 0) {
            for (let j = k+1; j < nu; j++) {
              let t = 0;
              for (let i = k; i < m; i++) {
                t += U[i][k] * U[i][j];
              }

              t = -t / U[k][k];
              for (let i = k; i < m; i++) {
                U[i][j] += t * U[i][k];
              }
            }

            for (let i = k; i < m; i++ ) {
              U[i][k] = -U[i][k];
            }

            U[k][k] = 1 + U[k][k];
            for (let i = 0; i < k-1; i++) {
              U[i][k] = 0;
            }

          } else {
            for (let i = 0; i < m; i++) {
              U[i][k] = 0;
            }

            U[k][k] = 1;
          }
       }
    }

    //TODO: delete want v later
    if (wantv) {
      for (let k = n-1; k >= 0; k--) {
        if ((k < nrt) && (e[k] != 0)) {
            for (let j = k+1; j < nu; j++) {
              let t = 0;
              for (let i = k+1; i < n; i++) {
                t += V[i][k] * V[i][j];
              }

              t = -t/V[k+1][k];
              for (let i = k+1; i < n; i++) {
                V[i][j] += t * V[i][k];
              }
            }
        }

        for (let i = 0; i < n; i++) {
          V[i][k] = 0;
        }
        
        V[k][k] = 1;
      }
    }

    // Main iteration loop for the singular values.
    const pp = p-1;
    let iter = 0;
    const eps = Math.pow(2, -52);
    const tiny = Math.pow(2, -966);
    while (p > 0) {
      let k, kase = 0;

      // Here is where a test for too many iterations would go.

      // This section of the program inspects for
      // negligible elements in the s and e arrays.  On
      // completion the variables kase and k are set as follows.

      // kase = 1     if s(p) and e[k-1] are negligible and k<p
      // kase = 2     if s(k) is negligible and k<p
      // kase = 3     if e[k-1] is negligible, k<p, and
      //              s(k), ..., s(p) are not negligible (qr step).
      // kase = 4     if e(p-1) is negligible (convergence).

      for (k = p-2; k >= -1; k--) {
        if (k == -1) break;

        if (Math.abs(e[k]) <= tiny + eps*(Math.abs(s[k]) + Math.abs(s[k+1]))) {
          e[k] = 0;
          break;
        }
      }

      if (k == p-2) kase = 4;
      else {
        let ks;
        for (ks = p-1; ks >= k; ks--) {
          if (ks == k) break;
          let t = (ks != p ? Math.abs(e[ks]) : 0.) + (ks != k+1 ? Math.abs(e[ks-1]) : 0);

          if (Math.abs(s[ks]) <= tiny + eps*t)  {
            s[ks] = 0;
            break;
          }
        }

        if (ks == k) kase = 3;
        else if (ks == p-1) kase = 1;
        else {
          kase = 2;
          k = ks;
        }
      }
      k++;

      // Perform the task indicated by kase.
      switch (kase) {

         // Deflate negligible s(p).
        case 1: {
          let f = e[p-2];
          e[p-2] = 0;
          for (let j = p-2; j >= k; j--) {
            let t = Math.hypot(s[j],f);
            const cs = s[j]/t;
            const sn = f/t;
            s[j] = t;

            if (j != k) {
              f = -sn*e[j-1];
              e[j-1] = cs * e[j-1];
            }
            
            if (wantv) {
              for (let i = 0; i < n; i++) {
                t = cs*V[i][j] + sn*V[i][p-1];
                V[i][p-1] = -sn*V[i][j] + cs*V[i][p-1];
                V[i][j] = t;
              }
            }
          }
        }
        break;

         // Split at negligible s(k).
        case 2: {
          let f = e[k-1];
          e[k-1] = 0;
          for (let j = k; j < p; j++) {
            let t = Math.hypot(s[j],f);
            const cs = s[j]/t;
            const sn = f/t;
            s[j] = t;
            f = -sn*e[j];
            e[j] = cs*e[j];

            if (wantu) {
              for (let i = 0; i < m; i++) {
                t = cs*U[i][j] + sn*U[i][k-1];
                U[i][k-1] = -sn*U[i][j] + cs*U[i][k-1];
                U[i][j] = t;
              }
            }
          }
        }
        break;

         // Perform one qr step.

        case 3: {
          // Calculate the shift.
          const scale = Math.max(Math.max(Math.max(Math.max(
                Math.abs(s[p-1]), Math.abs(s[p-2])), Math.abs(e[p-2])), 
                Math.abs(s[k])), Math.abs(e[k]));
          const sp = s[p-1]/scale;
          const spm1 = s[p-2]/scale;
          const epm1 = e[p-2]/scale;
          const sk = s[k]/scale;
          const ek = e[k]/scale;
          const b = ((spm1 + sp)*(spm1 - sp) + epm1*epm1)/2;
          const c = (sp*epm1)*(sp*epm1);
          let shift = 0;

          if ((b != 0) || (c != 0)) {
            shift = Math.sqrt(b*b + c);
            if (b < 0) shift = -shift;
            shift = c/(b + shift);
          }

          let f = (sk + sp)*(sk - sp) + shift;
          let g = sk*ek;

          // Chase zeros.

          for (let j = k; j < p-1; j++) {
            let t = Math.hypot(f,g);
            let cs = f/t;
            let sn = g/t;

            if (j != k) e[j-1] = t;

            f = cs*s[j] + sn*e[j];
            e[j] = cs*e[j] - sn*s[j];
            g = sn*s[j+1];
            s[j+1] = cs*s[j+1];

            if (wantv) {
              for (let i = 0; i < n; i++) {
                t = cs*V[i][j] + sn*V[i][j+1];
                V[i][j+1] = -sn*V[i][j] + cs*V[i][j+1];
                V[i][j] = t;
              }
            }

            t = Math.hypot(f,g);
            cs = f/t;
            sn = g/t;
            s[j] = t;
            f = cs*e[j] + sn*s[j+1];
            s[j+1] = -sn*e[j] + cs*s[j+1];
            g = sn*e[j+1];
            e[j+1] = cs*e[j+1];

            if (wantu && (j < m-1)) {
              for (let i = 0; i < m; i++) {
                t = cs*U[i][j] + sn*U[i][j+1];
                U[i][j+1] = -sn*U[i][j] + cs*U[i][j+1];
                U[i][j] = t;
              }
            }
          }
          e[p-2] = f;
          iter = iter + 1;
        }
        break;

        // Convergence.
        case 4: {

          // Make the singular values positive.
          if (s[k] <= 0) {
            s[k] = (s[k] < 0 ? -s[k] : 0);
            if (wantv) {
              for (let i = 0; i <= pp; i++) {
                V[i][k] = -V[i][k];
              }
            }
          }

          // Order the singular values.
          while (k < pp) {
            if (s[k] >= s[k+1]) break;

            let t = s[k];
            s[k] = s[k+1];
            s[k+1] = t;

            if (wantv && (k < n-1)) {
              for (let i = 0; i < n; i++) {
                t = V[i][k+1]; V[i][k+1] = V[i][k]; V[i][k] = t;
              }
            }

            if (wantu && (k < m-1)) {
              for (let i = 0; i < m; i++) {
                t = U[i][k+1]; 
                U[i][k+1] = U[i][k]; 
                U[i][k] = t;
              }
            }
            k++;
          }

          iter = 0;
          p--;
        }
        break;
      }
    }

    this.u = U;
    this.sv = s;
    this.v = V;

    return this
  }

  public U() {
    return this.u
  }

  public S() {
    // Calculate the multi-diagonal S
    const S: number[][] = this.matrix.construct(this.n, this.m) as number[][]
    
    for (let i = 0; i < this.m; i++) {
      S[i][i] = this.sv[i];
    }

    return S
  }

  public SV() {
    return this.sv
  }

  public V() {
    return this.v
  }

  public VT() {
    return this.matrix.transpose(this.v);
  }

  public K() {
    const q = 0.9;
    let K = 0;
    let frobA = 0;
    let frobAk = 0;
    let clt = 0
    for(let i = 0; i < this.rank(); i++) frobA += this.sv[i];
    do {
      for(let i = 0; i <= K; i++) frobAk += this.sv[i];
      clt = frobAk / frobA;
      K++;
    } while (clt < q);

    return K
  }

  public rank(): number {
    const EPS = Math.pow(2, -52);
    const TOL = Math.max(this.m, this.n) * this.sv[0] * EPS;
    let rank = 0;
    for (let i = 0; i < this.sv.length; i++) { 
      if (this.sv[i] > TOL) {
        ++rank;
      }
    }

    return rank
  }
}