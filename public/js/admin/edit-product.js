document.addEventListener("DOMContentLoaded", function () {
    // Shared constants for colors
    const colorPalette = [
        { name: "Pitch Black", hex: "#000000" }, { name: "Deep Charcoal", hex: "#212121" },
        { name: "Steel Gray", hex: "#4A4A4A" }, { name: "Concrete Gray", hex: "#757575" },
        { name: "Silver Metallic", hex: "#C0C0C0" }, { name: "Soft Smoke", hex: "#E0E0E0" },
        { name: "Off-White", hex: "#F5F5F5" }, { name: "Pure White", hex: "#FFFFFF" },
        { name: "Midnight Navy", hex: "#1A2238" }, { name: "Royal Blue", hex: "#2B3467" },
        { name: "Denim Blue", hex: "#5C7CFA" }, { name: "Forest Green", hex: "#2D6A4F" },
        { name: "Hunter Olive", hex: "#556B2F" }, { name: "Deep Burgundy", hex: "#800020" },
        { name: "Slate Teal", hex: "#37474F" }, { name: "Sand Beige", hex: "#D7C49E" },
        { name: "Electric Orange", hex: "#FF6D00" }, { name: "Solar Yellow", hex: "#FFC107" },
        { name: "Crimson Red", hex: "#D32F2F" }, { name: "Deep Violet", hex: "#4A148C" },
        { name: "Sky Azure", hex: "#03A9F4" }, { name: "Success Emerald", hex: "#4CAF50" },
        { name: "Alert Amber", hex: "#FFA000" }, { name: "Error Rose", hex: "#FF5252" }
    ];

    const productForm = document.getElementById("productForm");

    // ==========================================
    // CROPPER SHARED SETUP
    // ==========================================
    let cropper;
    let currentFileIndex = 0;
    let currentFilesToCrop = [];
    let currentCard = null;
    let currentPreviewGrid = null;
    const cropperModalEl = document.getElementById('cropperModal');
    let cropperModal;
    if (cropperModalEl) {
        cropperModal = new bootstrap.Modal(cropperModalEl);
    }
    const cropperImage = document.getElementById('cropperImage');

    function processFilesForCropping(files, index, card, previewGrid) {
        if (index >= files.length) return;
        currentFilesToCrop = files;
        currentFileIndex = index;
        currentCard = card;
        currentPreviewGrid = previewGrid;

        const file = files[index];
        const reader = new FileReader();
        reader.onload = function (e) {
            cropperImage.src = e.target.result;
            cropperModal.show();
        };
        reader.readAsDataURL(file);
    }

    if (cropperModalEl) {
        cropperModalEl.addEventListener('shown.bs.modal', function () {
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropperImage, {
                aspectRatio: 3 / 4,
                viewMode: 1,
                autoCropArea: 1,
            });
        });

        document.getElementById('applyCropBtn').addEventListener('click', function () {
            if (!cropper) return;
            cropper.getCroppedCanvas({
                width: 600,
                height: 800,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            }).toBlob(function (blob) {
                const originalFile = currentFilesToCrop[currentFileIndex];
                const fileName = originalFile.name;
                const croppedFile = new File([blob], fileName, { type: "image/jpeg", lastModified: new Date().getTime() });

                if (!currentCard.croppedFiles) currentCard.croppedFiles = [];
                currentCard.croppedFiles.push(croppedFile);

                const url = URL.createObjectURL(blob);
                showImagePreviewUI(currentPreviewGrid, url, croppedFile, currentCard);

                cropperModal.hide();
            }, 'image/jpeg', 0.9);
        });

        document.getElementById('cancelCropBtn').addEventListener('click', () => cropperModal.hide());
        document.getElementById('closeCropperBtn').addEventListener('click', () => cropperModal.hide());

        cropperModalEl.addEventListener('hidden.bs.modal', function () {
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            currentFileIndex++;
            if (currentFileIndex < currentFilesToCrop.length) {
                processFilesForCropping(currentFilesToCrop, currentFileIndex, currentCard, currentPreviewGrid);
            }
        });
    }

    // Get Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert("No Product ID found in URL!");
        return;
    }

    // ==========================================
    // 1. INITIAL LOAD (Categories + Product Data)
    // ==========================================

    // First, load categories
    fetch('/api/admin/categories/list')
        .then(res => res.json())
        .then(data => {
            const categorySelect = document.getElementById("categorySelect");
            const categories = data.categories || [];
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat._id;
                option.textContent = cat.name;
                categorySelect.appendChild(option);
            });

            // After categories are loaded, fetch the specific product details
            fetchProductDetails(productId);
        });

    function fetchProductDetails(id) {
        fetch(`/api/admin/products/${id}`)
            .then(res => res.json())
            .then(product => {
                // Fill basic form fields
                document.getElementById("productId").value = product._id;
                document.querySelector('[name="name"]').value = product.name;
                document.querySelector('[name="description"]').value = product.description;
                document.getElementById("productPrice").value = product.price;
                document.getElementById("offerPrice").value = product.offerPrice || '';
                document.getElementById("categorySelect").value = product.category?._id || product.category;

                // Status Switch
                const statusSwitch = document.getElementById("statusSwitch");
                const statusValueInput = document.getElementById("statusValue");
                if (statusSwitch) statusSwitch.checked = product.status;
                statusValueInput.value = product.status ? "true" : "false";

                // Load existing variants
                const variantContainer = document.getElementById("variantContainer");
                variantContainer.innerHTML = ""; // Clear initial dummy variant
                product.variants.forEach(data => addNewVariantUI(data));
            });
    }

    // ==========================================
    // 2. FORM SUBMISSION (PUT)
    // ==========================================
    productForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", document.querySelector('[name="name"]').value);
        formData.append("description", document.querySelector('[name="description"]').value);
        formData.append("category", document.getElementById("categorySelect").value);
        formData.append("price", document.getElementById("productPrice").value);
        formData.append("offerPrice", document.getElementById("offerPrice").value);
        formData.append("status", document.getElementById("statusValue").value);

        let hasError = false;
        const variants = [];
        document.querySelectorAll(".variant-card").forEach((card, index) => {
            // Get already existing images that were not removed
            const keptImages = [];
            card.querySelectorAll(".preview-item").forEach(item => {
                const imgSrc = item.querySelector("img").src;
                if (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:')) return; // skip new previews

                // Get filename and decode to prevent double encoding spaces
                const filename = decodeURIComponent(imgSrc.split('/').pop());
                keptImages.push(filename);
            });

            const croppedFiles = card.croppedFiles || [];
            if (keptImages.length + croppedFiles.length !== 4) {
                alert(`Please ensure exactly 4 images are set for variant ${index + 1}. You have ${keptImages.length + croppedFiles.length} images.`);
                hasError = true;
                return;
            }

            const vData = {
                color: card.querySelector(".variant-color-input").value,
                colorName: card.querySelector(".selected-color-name").textContent.trim(),
                images: keptImages, // Include existing images to keep
                sizes: []
            };

            card.querySelectorAll(".size-row").forEach(row => {
                vData.sizes.push({
                    size: row.querySelector(".size-name").value,
                    stock: parseInt(row.querySelector(".size-stock").value) || 0
                });
            });
            variants.push(vData);

            // New Images (actually uploaded files)
            if (croppedFiles.length > 0) {
                croppedFiles.forEach(f => formData.append(`variantImages${index}`, f));
            }
        });

        if (hasError) return;

        formData.append("variants", JSON.stringify(variants));

        // Submit PUT request to update
        fetch(`/api/admin/products/${productId}`, {
            method: "PUT",
            body: formData
        })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    alert("Product Updated Successfully!");
                    window.location.href = "/api/admin/products";
                } else {
                    alert("Error: " + result.message);
                }
            });
    });

    // Handle Delete Product (exposed to global for HTML onclick)
    window.deleteProduct = function (id) {
        if (confirm("Are you sure you want to delete this product?")) {
            fetch(`/api/admin/products/${id}`, { method: "DELETE" })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        alert("Product deleted successfully");
                        window.location.href = "/api/admin/products";
                    } else {
                        alert("Failed to delete product: " + result.message);
                    }
                });
        }
    };

    // ==========================================
    // UI HELPERS (Same as add-product.js but for existing data)
    // ==========================================

    document.getElementById("addVariantBtn").addEventListener("click", () => addNewVariantUI());

    function addNewVariantUI(data = null) {
        const variantContainer = document.getElementById("variantContainer");
        const template = document.getElementById("variantTemplate");
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector(".variant-card");

        const colorInput = card.querySelector(".variant-color-input");
        const colorNameSpan = card.querySelector(".selected-color-name");

        colorInput.value = data ? data.color : "";
        colorNameSpan.textContent = data ? (data.colorName || "Selected") : "No color selected";

        const swatchesGrid = card.querySelector(".color-selector-grid");
        colorPalette.forEach(c => {
            const swatch = document.createElement("div");
            swatch.className = "color-swatch";
            if (data && data.color === c.hex) swatch.classList.add("active");
            swatch.style.backgroundColor = c.hex;
            swatch.onclick = () => {
                card.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
                swatch.classList.add("active");
                colorInput.value = c.hex;
                colorNameSpan.textContent = c.name;
            };
            swatchesGrid.appendChild(swatch);
        });

        const sizeBox = card.querySelector(".size-container");
        if (data && data.sizes) {
            data.sizes.forEach(s => addNewSizeRowUI(sizeBox, s));
        } else {
            addNewSizeRowUI(sizeBox);
        }

        card.querySelector(".add-size-btn").onclick = () => addNewSizeRowUI(sizeBox);
        card.querySelector(".remove-variant-card").onclick = () => {
            if (variantContainer.children.length > 1) card.remove();
        };

        // Existing Image Previews
        card.croppedFiles = [];
        const previewGrid = card.querySelector(".image-preview-grid");
        if (data && data.images) {
            data.images.forEach(img => showImagePreviewUI(previewGrid, `/images/products/${img}`));
        }

        card.querySelector(".variant-image-input").onchange = (e) => {
            const files = Array.from(e.target.files);
            e.target.value = ''; // clear input
            if (files.length > 0) {
                processFilesForCropping(files, 0, card, previewGrid);
            }
        };

        // Copy images to all variants
        card.querySelector(".copy-images-btn").onclick = () => {
            const sourceFiles = card.croppedFiles || [];
            const sourceKeptImages = [];
            card.querySelectorAll(".preview-item").forEach(item => {
                const img = item.querySelector("img").src;
                // If it's a server image (not a blob/data URL)
                if (!img.startsWith('data:') && !img.startsWith('blob:')) {
                    sourceKeptImages.push(img);
                }
            });

            if (sourceFiles.length === 0 && sourceKeptImages.length === 0) {
                alert("Please upload images to this variant first.");
                return;
            }

            if (!confirm(`Copy these images to all other variants? This will overwrite their existing selections.`)) {
                return;
            }

            document.querySelectorAll(".variant-card").forEach(otherCard => {
                if (otherCard === card) return;

                const otherGrid = otherCard.querySelector(".image-preview-grid");
                otherGrid.innerHTML = "";
                otherCard.croppedFiles = [...sourceFiles];

                // Restore kept images to others
                sourceKeptImages.forEach(src => {
                    showImagePreviewUI(otherGrid, src, null, otherCard);
                });

                // Add newly cropped files to others
                otherCard.croppedFiles.forEach(file => {
                    const url = URL.createObjectURL(file);
                    showImagePreviewUI(otherGrid, url, file, otherCard);
                });
            });
            alert("Images copied to all variants!");
        };

        variantContainer.appendChild(clone);
    }

    function addNewSizeRowUI(box, data = null) {
        const template = document.getElementById("sizeRowTemplate");
        const clone = template.content.cloneNode(true);
        const row = clone.querySelector(".size-row");
        if (data) {
            row.querySelector(".size-name").value = data.size;
            row.querySelector(".size-stock").value = data.stock || 0;
        } else {
            row.querySelector(".size-stock").value = 0; // New sizes default to 0
        }
        row.querySelector(".remove-size-row").onclick = () => { if (box.children.length > 1) row.remove(); };
        box.appendChild(clone);
    }

    function showImagePreviewUI(grid, src, fileObj = null, card = null) {
        const template = document.getElementById("imagePreviewTemplate");
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector(".preview-item");
        clone.querySelector("img").src = src;
        clone.querySelector(".btn-remove-v-img").onclick = () => {
            item.remove();
            if (fileObj && card && card.croppedFiles) {
                const index = card.croppedFiles.indexOf(fileObj);
                if (index > -1) {
                    card.croppedFiles.splice(index, 1);
                }
            }
        };
        grid.appendChild(clone);
    }

    // Status toggle helper
    const statusSwitch = document.getElementById("statusSwitch");
    if (statusSwitch) {
        statusSwitch.onchange = (e) => {
            document.getElementById("statusValue").value = e.target.checked ? "true" : "false";
        };
    }
});
