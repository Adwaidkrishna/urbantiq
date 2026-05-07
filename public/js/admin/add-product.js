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
        reader.onload = function(e) {
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

        document.getElementById('applyCropBtn').addEventListener('click', function() {
            if (!cropper) return;
            cropper.getCroppedCanvas({
                width: 600,
                height: 800,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            }).toBlob(function(blob) {
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

    // ==========================================
    // 1. LOAD CATEGORIES INTO DROPDOWN
    // ==========================================
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
        });

    // ==========================================
    // 2. FORM INITIALIZATION
    // ==========================================
    addNewVariantUI(); // Add first variant by default

    document.getElementById("addVariantBtn").addEventListener("click", function () {
        addNewVariantUI();
    });

    // Status switch logic
    const statusSwitch = document.getElementById("statusSwitch");
    if (statusSwitch) {
        statusSwitch.addEventListener("change", function(e) {
            document.getElementById("statusValue").value = e.target.checked ? "true" : "false";
        });
    }

    // ==========================================
    // 3. FORM SUBMISSION (POST)
    // ==========================================
    productForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData();
        
        // Add basic details
        formData.append("name", document.querySelector('[name="name"]').value);
        formData.append("description", document.querySelector('[name="description"]').value);
        formData.append("category", document.getElementById("categorySelect").value);
        formData.append("price", document.getElementById("productPrice").value);
        formData.append("offerPrice", document.getElementById("offerPrice").value);
        formData.append("status", document.getElementById("statusValue").value);

        let hasError = false;
        // Add variants
        const variants = [];
        document.querySelectorAll(".variant-card").forEach((card, index) => {
            const croppedFiles = card.croppedFiles || [];
            if (croppedFiles.length !== 4) {
                alert(`Please upload exactly four images for variant ${index + 1}. You have ${croppedFiles.length} images.`);
                hasError = true;
                return;
            }

            const vData = {
                color: card.querySelector(".variant-color-input").value,
                colorName: card.querySelector(".selected-color-name").textContent.trim(),
                sizes: []
            };

            // Sizes for this variant
            card.querySelectorAll(".size-row").forEach(row => {
                vData.sizes.push({
                    size: row.querySelector(".size-name").value,
                    stock: 0 // Stock is handled exclusively by Batch Implementation
                });
            });
            variants.push(vData);

            // Images for this variant
            if (croppedFiles.length > 0) {
                croppedFiles.forEach(f => formData.append(`variantImages${index}`, f));
            }
        });

        if (hasError) return;

        formData.append("variants", JSON.stringify(variants));

        // Submit to API
        fetch("/api/admin/products", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert("Product Created Successfully!");
                window.location.href = "/api/admin/products";
            } else {
                alert("Error: " + result.message);
            }
        })
        .catch(error => console.error("Error creating product:", error));
    });

    // ==========================================
    // UI HELPERS (Variants, Sizes, Previews)
    // ==========================================

    function addNewVariantUI() {
        const variantContainer = document.getElementById("variantContainer");
        const template = document.getElementById("variantTemplate");
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector(".variant-card");
        
        // Setup color palette
        const swatchesGrid = card.querySelector(".color-selector-grid");
        colorPalette.forEach(c => {
            const swatch = document.createElement("div");
            swatch.className = "color-swatch";
            swatch.style.backgroundColor = c.hex;
            swatch.addEventListener("click", function() {
                card.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
                swatch.classList.add("active");
                card.querySelector(".variant-color-input").value = c.hex;
                card.querySelector(".selected-color-name").textContent = c.name;
            });
            swatchesGrid.appendChild(swatch);
        });

        // Add first size row
        const sizeBox = card.querySelector(".size-container");
        addNewSizeRowUI(sizeBox);

        card.querySelector(".add-size-btn").addEventListener("click", () => addNewSizeRowUI(sizeBox));
        
        card.querySelector(".remove-variant-card").addEventListener("click", function() {
            if (variantContainer.children.length > 1) card.remove();
        });

        // Image previews
        card.croppedFiles = [];
        card.querySelector(".variant-image-input").addEventListener("change", function(e) {
            const previewGrid = card.querySelector(".image-preview-grid");
            const files = Array.from(e.target.files);
            e.target.value = ''; // clear input
            if (files.length > 0) {
                processFilesForCropping(files, 0, card, previewGrid);
            }
        });

        // Copy images to all variants
        card.querySelector(".copy-images-btn").addEventListener("click", function() {
            const sourceFiles = card.croppedFiles || [];
            if (sourceFiles.length === 0) {
                alert("Please upload images to this variant first.");
                return;
            }

            if (!confirm(`Copy these ${sourceFiles.length} images to all other variants? This will overwrite their existing images.`)) {
                return;
            }

            document.querySelectorAll(".variant-card").forEach(otherCard => {
                if (otherCard === card) return;

                // Sync the files
                otherCard.croppedFiles = [...sourceFiles];
                const otherGrid = otherCard.querySelector(".image-preview-grid");
                otherGrid.innerHTML = "";

                // Display previews
                otherCard.croppedFiles.forEach(file => {
                    const url = URL.createObjectURL(file);
                    showImagePreviewUI(otherGrid, url, file, otherCard);
                });
            });
            alert("Images copied to all variants!");
        });

        variantContainer.appendChild(clone);
    }

    function addNewSizeRowUI(box) {
        const template = document.getElementById("sizeRowTemplate");
        const clone = template.content.cloneNode(true);
        const row = clone.querySelector(".size-row");
        row.querySelector(".remove-size-row").addEventListener("click", function() {
            if (box.children.length > 1) row.remove();
        });
        box.appendChild(clone);
    }

    function showImagePreviewUI(grid, src, fileObj = null, card = null) {
        const template = document.getElementById("imagePreviewTemplate");
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector(".preview-item");
        clone.querySelector("img").src = src;
        clone.querySelector(".btn-remove-v-img").addEventListener("click", () => {
            item.remove();
            if (fileObj && card && card.croppedFiles) {
                const index = card.croppedFiles.indexOf(fileObj);
                if (index > -1) {
                    card.croppedFiles.splice(index, 1);
                }
            }
        });
        grid.appendChild(clone);
    }
});
