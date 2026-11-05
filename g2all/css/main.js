function load_script(src, remote = true, transfer = []) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function doJb() {
  if (window.onExploitProgress) window.onExploitProgress("Menginisialisasi WebKit Heap...", 20);
  await load_script("css/misc.js");

  try {
    version.init();
    switch (version.console) {
      case 4:
        await load_script("css/ps4/constants.js");
        await load_script("css/ps4/userland.js");
        break;
      case 5:
        //TODO
        break;
      default:
        logger.info("Unsupported console " + version.console);
    }

    if (window.onExploitProgress) window.onExploitProgress("Membentuk Memory Primitive...", 38);
    logger.info("===USERLAND===");

    let rw = undefined;
    if (arw.master === undefined) {
      rw = await init_rw();
    }

    init_arw(rw);
    init_rop();
    init_syscalls();

    logger.info("===END===");

    await load_script("css/loader.js");
    await load_script("css/workers.js");

    switch (version.console) {
      case 4:
        await load_script("css/ps4/kernel.js");
        break;
      case 5:
        //TODO
        break;
      default:
        logger.info("Unsupported console " + version.console);
    }

    if (fn.setuid.invoke(0) !== -1) {
      if (window.onExploitDone) {
        window.onExploitDone("GoldHEN Sudah Terpasang Sebelumnya ✔");
      } else {
        msgs.innerHTML = "GoldHEN is Already Loaded ...";
      }
      return;
    }

    var exploitChain = localStorage.getItem("exploitChain") || "lapse";
    if (window.onExploitProgress) window.onExploitProgress("Memicu Kernel Exploit (" + exploitChain + ")...", 65);
    await load_script("css/" + exploitChain + ".js");
    logger.info("===" + exploitChain.toUpperCase() + "===");

    try {
      if (exploitChain == "lapse") {
        init();
        await setup();
        await double_free_reqs2();
        leak_kaddrs();
        double_free_reqs1();
        make_karw();
        inc_karw_pipe_refcnt();

        logger.info("Corrupted context cleanup started...");
        remove_pktinfo_from_so(pktopts_twins[0]);
        remove_rthdr_from_so(pktopts_twins[1]);
        remove_rthdr_from_so(rthdr_twins[0]);
        logger.info("Corrupted context cleanup completed !!");
      } else {
        init();
        await setup();
        await ucred_triple_free();
        leak_kqueue();
        await make_karw();
        inc_karw_pipe_refcnt();

        logger.info("Corrupted context cleanup started...");
        for (let i = 0; i < triplets.length; i++) {
          remove_rthdr_from_so(triplets[i]);
        }
        remove_uaf_file();
        logger.info("Corrupted context cleanup completed !!");
      }
    } finally {
      cleanup();
    }

    find_all_proc();

    if (fn.setuid.invoke(0) === -1) {
      if (window.onExploitProgress) window.onExploitProgress("Root OK! Memasang Patches & Injeksi GoldHEN...", 85);
      jailbreak();

      const kpatches_rsp = await fetch("css/ps4/patches/" + constants.KPATCH);
      const kpatches_buf = await kpatches_rsp.arrayBuffer();
      const kpatches_u8 = new Uint8Array(kpatches_buf);
      kernel_patches(kpatches_u8);

      const bin_rsp = await fetch("goldhen_2.4b18.12.bin");
      const bin_buf = await bin_rsp.arrayBuffer();
      const bin_u8 = new Uint8Array(bin_buf);
      load_bin(bin_u8);
    }

    if (window.onExploitDone) {
      window.onExploitDone("GoldHEN v2.4b18.12 Berhasil Dimuat ✔");
    } else {
      msgs.innerHTML = "GoldHEN v2.4b18.12 Loaded ...";
    }
    logger.info("===END===");
  } catch (e) {
    if (window.onExploitFail) {
      window.onExploitFail("Gagal memuat exploit: " + (e.message || e));
    } else {
      msgs.innerHTML = "Failed to Load! Restart Your Console ...";
      msgs.style.color = "yellow";
    }
  }
}
