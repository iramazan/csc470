var number_of_iterations = 1; // number of divisions to perform
var gl; // opengl functions
var canvas;
var shader_program;
var vertices = [
     0.33,  0.33, 0, 1,
     0.33, -0.33, 0, 1,
    -0.33, -0.33, 0, 1,
    -0.33,  0.33, 0, 1
];
var is_rotating = false;
var is_reversed = false;
var theta = 0;

window.onload = function main()
{
    var n = 0; // number of iterations currently performed
    gl_init(); // gl setup
    doc_init(); // document setup
    compile_shaders(); // shader program
    draw(n); // do the actual work
};

// Initialize scripting for html document
function doc_init()
{
    // scripting for iteration slider
    var iter_slider = document.getElementById("iter_slider");
    var iter_label = document.getElementById("iter_label");
    var iter_func = function() {
        iter_label.textContent = iter_slider.value;
        number_of_iterations = iter_slider.value;
        var n = 0;
        gl.clear(gl.COLOR_BUFFER_BIT);
        draw(n);
    };
    iter_slider.addEventListener("input", iter_func, false);
     
    // scripting for rotate button
    var rotate_button = document.getElementById("rotate_button");
    var rotate_func = function() {
        is_rotating = !is_rotating;
        var prev = 0;
        var animate = function(current) {
            current *= 0.003;
            var delta = current - prev;
            prev = current;
            var n = 0;
            gl.clear(gl.COLOR_BUFFER_BIT);
            is_reversed ? theta += delta : theta -= delta;
            draw(n);
            if (is_rotating) {
                window.requestAnimationFrame(animate);
            }
        };
        if (is_rotating) {
            window.requestAnimationFrame(animate);
        }
    };
    rotate_button.addEventListener("click", rotate_func, false);

    // scripting for canvas click event
    var canvas_func = function() {
        is_reversed = !is_reversed;
    };
    canvas.addEventListener("click", canvas_func, false);
}

// Initialize opengl
function gl_init()
{
    canvas = document.getElementById("gl_canvas");
    try {
        gl = canvas.getContext('experimental-webgl');
    } catch (e) {
        throw new Error('WebGL could not be found');
    }
    // prepare viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// compile shaders and create shader program
function compile_shaders()
{
    // vertex shader
    var vert_shader = gl.createShader(gl.VERTEX_SHADER);
    var vert_code = document.getElementById("vertex_shader");
    gl.shaderSource(vert_shader, vert_code.text);
    gl.compileShader(vert_shader);
    if (!gl.getShaderParameter(vert_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vert_shader));
    }

    // fragment shader
    var frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
    var frag_code = document.getElementById("fragment_shader");
    gl.shaderSource(frag_shader, frag_code.text);
    gl.compileShader(frag_shader);
    if (!gl.getShaderParameter(frag_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(frag_shader));
    }

    // create shader program
    shader_program = gl.createProgram();
    gl.attachShader(shader_program, vert_shader);
    gl.attachShader(shader_program, frag_shader);
    gl.linkProgram(shader_program);
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(shader_program));
    }
    gl.useProgram(shader_program);
}

// prepare data and render
function draw(n, shift_x = 0, shift_y = 0)
{
    // prepare data to send to graphics card
    var factor = Math.pow(0.333333, n);
    var factor_location = gl.getUniformLocation(shader_program, "factor");
    gl.uniform1f(factor_location, factor);
    var theta_location = gl.getUniformLocation(shader_program, "theta");
    gl.uniform1f(theta_location, theta);
    var shift_location = gl.getUniformLocation(shader_program, "shift");
    gl.uniform2fv(shift_location, new Float32Array([shift_x, shift_y]));
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var vert_coord = gl.getAttribLocation(shader_program, "coordinate");
    gl.vertexAttribPointer(vert_coord, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vert_coord);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // perform iterations
    n++;
    if (n < number_of_iterations) {
        var shift_xnp = shift_x / 3 + 0.66;
        var shift_xnm = shift_x / 3 - 0.66;
        var shift_ynp = shift_y / 3 + 0.66;
        var shift_ynm = shift_y / 3 - 0.66;
        draw(n, shift_xnp, shift_ynp); // top right
        draw(n, shift_xnm, shift_ynm); // bottom left
        draw(n, -1*(shift_xnm), shift_ynm); // bottom right
        draw(n, -1*(shift_xnp), shift_ynp); // top left
        draw(n, shift_xnm, shift_y/3); // mid right
        draw(n, shift_xnp, shift_y/3); // mid left
        draw(n, shift_x/3, shift_ynm); // bottom
        draw(n, shift_x/3, shift_ynp); // top
    }
}
